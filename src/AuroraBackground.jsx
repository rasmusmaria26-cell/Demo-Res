import { useRef, useEffect, useCallback } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * AuroraBackground
 * ─────────────────
 * WebGL-powered aurora borealis shader that:
 * 1. Flows organically with time (slow sine waves of colour)
 * 2. Reacts to mouse — cursor creates a warm gold ripple that
 *    distorts the aurora, fading out naturally
 *
 * Props:
 *   style  — extra inline styles for the canvas wrapper
 *   children — content to layer above the aurora
 */
export default function AuroraBackground({ style, children }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const glRef = useRef(null);
  const progRef = useRef(null);
  const uRef = useRef({});
  const startRef = useRef(Date.now());

  /* Mouse in normalised device coords [-1, 1] */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 40, damping: 18 });
  const smy = useSpring(my, { stiffness: 40, damping: 18 });
  /* Ripple strength 0→1→0 */
  const ripple = useMotionValue(0);
  const sripple = useSpring(ripple, { stiffness: 60, damping: 14 });

  /* ── GLSL ── */
  const VERT = `
    attribute vec2 a_pos;
    void main(){ gl_Position = vec4(a_pos,0.,1.); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform vec2  u_mouse;   // NDC [-1,1]
    uniform float u_ripple;  // 0..1

    // ── helpers ──
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                 mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.,a=.5;
      for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.1+vec2(3.14,1.61); a*=.5; }
      return v;
    }

    // ── palette ──
    vec3 aurora(float t){
      // deep charcoal → warm gold → subtle terracotta
      vec3 a = vec3(0.05, 0.04, 0.03);   // deep charcoal base
      vec3 b = vec3(0.12, 0.09, 0.06);   // muted brown
      vec3 c = vec3(0.35, 0.20, 0.08);   // deep bronze
      vec3 d = vec3(0.70, 0.45, 0.15);   // warm gold
      vec3 e = vec3(0.85, 0.50, 0.20);   // bright terracotta edge
      float s = t*4.;
      if(s<1.) return mix(a,b,s);
      if(s<2.) return mix(b,c,s-1.);
      if(s<3.) return mix(c,d,s-2.);
      return mix(d,e,s-3.);
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.y = 1. - uv.y;
      float aspect = u_res.x / u_res.y;
      vec2 p = uv * vec2(aspect, 1.);

      float t = u_time * 0.12;

      // base aurora bands — slow undulating horizontal ribbons
      float wave1 = fbm(vec2(p.x*1.2 - t*0.4, p.y*2.8 + t*0.2));
      float wave2 = fbm(vec2(p.x*0.8 + t*0.3, p.y*1.6 - t*0.35));
      float wave3 = fbm(vec2(p.x*1.8 - t*0.25, p.y*3.2 + t*0.15 + 10.));

      // vertical band mask — aurora sits in upper-mid band
      float band = smoothstep(0.0, 0.45, uv.y) * smoothstep(1.0, 0.35, uv.y);
      band = pow(band, 0.7);

      float aurora_val = (wave1*0.5 + wave2*0.3 + wave3*0.2) * band;
      aurora_val = smoothstep(0.2, 0.78, aurora_val);

      // colour lookup
      vec3 col = aurora(aurora_val);

      // atmospheric glow from bottom (faint warm horizon)
      float horizon = exp(-uv.y * 5.0) * 0.18;
      col += vec3(0.40, 0.20, 0.08) * horizon;

      // star-like speckles (smooth rounded)
      vec2 star_p = p * 150.0;
      float star_hash = hash(floor(star_p));
      vec2 star_fract = fract(star_p) - 0.5;
      float star_shape = smoothstep(0.4, 0.05, length(star_fract));
      float stars = step(0.985, star_hash) * star_shape;
      
      // flicker effect
      stars *= 0.5 + 0.5 * sin(u_time * 2.0 + star_hash * 100.0);
      
      stars *= (1. - band) * smoothstep(0.3, 0.7, uv.y);
      col += vec3(0.95, 0.85, 0.7) * stars * 1.2;

      // ── mouse ripple ──
      vec2 mUV = (u_mouse * 0.5 + 0.5) * vec2(aspect, 1.);
      float dist = length(p - mUV);
      float rippleWave = sin(dist * 18. - u_time * 3.0) * exp(-dist * 4.5);
      float rippleMask = u_ripple * rippleWave * 0.22;
      // gold shimmer around cursor
      float glow = u_ripple * exp(-dist * dist * 12.) * 0.35;
      col += vec3(0.85, 0.60, 0.20) * (rippleMask + glow);

      // subtle vignette
      vec2 vig = uv * 2. - 1.;
      float vignette = 1. - dot(vig*vec2(0.6,0.9), vig*vec2(0.6,0.9))*0.35;
      col *= vignette;

      // tone-map & gamma
      col = col / (col + 0.3);
      col = pow(col, vec3(0.88));

      gl_FragColor = vec4(col, 1.);
    }
  `;

  /* ── init WebGL ── */
  const initGL = useCallback((canvas) => {
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;
    glRef.current = gl;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    progRef.current = prog;

    /* full-screen quad */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uRef.current = {
      res:    gl.getUniformLocation(prog, "u_res"),
      time:   gl.getUniformLocation(prog, "u_time"),
      mouse:  gl.getUniformLocation(prog, "u_mouse"),
      ripple: gl.getUniformLocation(prog, "u_ripple"),
    };
  }, []);

  /* ── render loop ── */
  const render = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;
    const canvas = canvasRef.current;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
    }
    const u = uRef.current;
    gl.uniform2f(u.res, W, H);
    gl.uniform1f(u.time, (Date.now() - startRef.current) / 1000);
    gl.uniform2f(u.mouse, smx.get(), smy.get());
    gl.uniform1f(u.ripple, sripple.get());
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafRef.current = requestAnimationFrame(render);
  }, [smx, smy, sripple]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initGL(canvas);
    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [initGL, render]);

  /* ── mouse events ── */
  const onMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(-(((e.clientY - rect.top) / rect.height) * 2 - 1));
    ripple.set(1);
    clearTimeout(onMove._t);
    onMove._t = setTimeout(() => ripple.set(0), 1200);
  }, [mx, my, ripple]);

  return (
    <div style={{ position: "relative", ...style }}>
      <canvas
        ref={canvasRef}
        onMouseMove={onMove}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
