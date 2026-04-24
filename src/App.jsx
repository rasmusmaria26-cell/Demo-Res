import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  motion, useMotionValue, useSpring, useScroll,
  useTransform, AnimatePresence, useInView, animate,
} from 'framer-motion'
import AuroraBackground from './AuroraBackground'

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

import imgAboutDish from './assets/about-dish.jpg'
import imgAboutPortrait from './assets/about-portrait.jpg'
import imgParallaxOcean from './assets/parallax-ocean.jpg'
import imgMenuSpread from './assets/menu-spread.jpg'
import imgExpInterior from './assets/experience-interior.jpg'

/* ════════════════════════════════════════════
   TOKENS
════════════════════════════════════════════ */
const C = {
  warmWhite: '#FAF8F3', cream: '#F5F0E8',
  charcoal: '#1A1814', deep: '#0D0C0A',
  gold: '#C9A96E', goldLight: '#E8D5A3',
  sage: '#7A8C72', terra: '#C4714A',
  muted: '#8C8278', border: 'rgba(201,169,110,0.18)',
}
const F = {
  display: `'Cormorant Garamond', serif`,
  label: `'Tenor Sans', sans-serif`,
  body: `'DM Sans', sans-serif`,
}

/* ════════════════════════════════════════════
   GLOBAL CSS
════════════════════════════════════════════ */
const Globals = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Tenor+Sans&family=DM+Sans:wght@300;400;500&display=swap');
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { font-family:'DM Sans',sans-serif; background:${C.warmWhite}; color:${C.charcoal}; overflow-x:hidden; cursor:none; }
    ::selection { background:rgba(201,169,110,0.28); }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:${C.warmWhite}; }
    ::-webkit-scrollbar-thumb { background:${C.gold}; border-radius:2px; }
    input,select,textarea,button { font-family:inherit; }
    textarea { resize:vertical; }

    /* Nav underline slide */
    .nl { position:relative; text-decoration:none; display:inline-block; }
    .nl::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:1px; background:${C.gold}; transition:width .4s cubic-bezier(.22,1,.36,1); }
    .nl:hover::after { width:100%; }

    /* Scroll hint animation */
    @keyframes sp { 0%{opacity:1;transform:scaleY(1) translateY(0)} 100%{opacity:0;transform:scaleY(.5) translateY(20px)} }
    .sp { animation: sp 1.8s ease-in-out infinite; }

    /* Ambient glow behind hero title */
    @keyframes glow { 0%,100%{opacity:.07;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.13;transform:translate(-50%,-50%) scale(1.2)} }

    /* Floating grain */
    @keyframes grain { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-2px,2px)} 40%{transform:translate(-2px,-2px)} 60%{transform:translate(2px,2px)} 80%{transform:translate(2px,-2px)} }
    .grain { animation: grain .6s steps(1) infinite; }

    /* Marquee */
    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
    .marquee { animation: marquee 28s linear infinite; }

    /* Date input */
    input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 40px; height: 100%; cursor: pointer; }

    /* Tab active indicator  */
    .tab-btn { transition: all .3s cubic-bezier(.22,1,.36,1); }
    .tab-btn:hover { color: ${C.gold} !important; border-color: rgba(201,169,110,0.5) !important; }

    @media(max-width:768px) {
      .hide-m { display:none!important; }
      .col1-m { grid-template-columns:1fr!important; }
      .pad-m  { padding:80px 24px!important; }

      body { padding-bottom: 80px; cursor: auto !important; }
      .mobile-nav-hide { display: none !important; }

      /* hero title scale */
      .hero-title { font-size: clamp(52px,15vw,80px) !important; line-height: 0.9 !important; }

      /* about image stack fix */
      .about-img-wrap { height: 320px !important; }
      .about-portrait-behind { display: none !important; }

      /* experience parallax image static on mobile */
      .exp-parallax { transform: none !important; }

      /* footer stack */
      footer { flex-direction: column !important; text-align: center !important; gap: 32px !important; padding: 48px 24px 100px !important; }
    }
  `}</style>
)

/* ════════════════════════════════════════════
   CUSTOM CURSOR  (dot + trailing ring with spring)
════════════════════════════════════════════ */
const Cursor = () => {
  const mx = useMotionValue(-200)
  const my = useMotionValue(-200)
  const rx = useSpring(mx, { stiffness: 80, damping: 16 })
  const ry = useSpring(my, { stiffness: 80, damping: 16 })
  const scale = useMotionValue(1)
  const rs = useSpring(scale, { stiffness: 200, damping: 20 })

  useEffect(() => {
    const move = e => { mx.set(e.clientX); my.set(e.clientY) }
    const over = e => {
      const t = e.target.closest('a,button,.hoverable')
      scale.set(t ? 2 : 1)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerover', over)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerover', over) }
  }, [])

  const base = { position: 'fixed', pointerEvents: 'none', zIndex: 99999, borderRadius: '50%', translateX: '-50%', translateY: '-50%' }
  return (
    <>
      {/* dot — snappy */}
      <motion.div style={{ ...base, x: mx, y: my, width: 7, height: 7, background: C.gold }} />
      {/* ring — spring lag */}
      <motion.div style={{ ...base, x: rx, y: ry, scale: rs, width: 32, height: 32, border: `1.5px solid ${C.gold}`, opacity: .7 }} />
    </>
  )
}

/* ════════════════════════════════════════════
   EFFECT 1 ╌ CursorMaskReveal
   Gold layer revealed through a large circular
   clip-path that follows & breathes on its own.
════════════════════════════════════════════ */
const CursorMaskReveal = ({ children }) => {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const r = useSpring(0, { stiffness: 100, damping: 18 })
  const [clip, setClip] = useState('circle(0px at 50% 50%)')
  const active = useRef(false)

  // keep clip-path string in sync
  useEffect(() => {
    const unsub = [
      mx.on('change', recalc),
      my.on('change', recalc),
      r.on('change', recalc),
    ]
    function recalc() {
      setClip(`circle(${r.get()}px at ${mx.get()}px ${my.get()}px)`)
    }
    return () => unsub.forEach(u => u())
  }, [])

  const onMove = useCallback(e => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mx.set(e.clientX - rect.left)
    my.set(e.clientY - rect.top)
  }, [])

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-block', cursor: 'none' }}
      onMouseMove={onMove}
      onMouseEnter={() => { active.current = true; r.set(240) }}
      onMouseLeave={() => { active.current = false; r.set(0) }}
    >
      {/* dark base text */}
      <div style={{ position: 'relative' }}>{children}</div>

      {/* bright gold revealed layer */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: clip,
        pointerEvents: 'none',
        WebkitClipPath: clip,
        transition: 'clip-path 0s',   // JS handles this
        color: C.goldLight,
        textShadow: `0 0 60px rgba(201,169,110,0.5)`,
      }}>
        {children}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   EFFECT 2 ╌ MomentumHoverCard
   3-D tilt with spring physics + cursor-tracked
   radial shine. Tilt up to ±14°.
════════════════════════════════════════════ */
const MomentumCard = ({ children, style }) => {
  const ref = useRef(null)
  const rX = useMotionValue(0)
  const rY = useMotionValue(0)
  const sX = useMotionValue(50)
  const sY = useMotionValue(50)

  const srX = useSpring(rX, { stiffness: 180, damping: 22 })
  const srY = useSpring(rY, { stiffness: 180, damping: 22 })
  const ssX = useSpring(sX, { stiffness: 180, damping: 22 })
  const ssY = useSpring(sY, { stiffness: 180, damping: 22 })

  const [shine, setShine] = useState([50, 50])
  useEffect(() => {
    const u1 = ssX.on('change', v => setShine(p => [v, p[1]]))
    const u2 = ssY.on('change', v => setShine(p => [p[0], v]))
    return () => { u1(); u2() }
  }, [])

  const move = e => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = (e.clientX - rect.left) / rect.width - 0.5
    const cy = (e.clientY - rect.top) / rect.height - 0.5
    rX.set(cy * -14)
    rY.set(cx * 14)
    sX.set(((e.clientX - rect.left) / rect.width) * 100)
    sY.set(((e.clientY - rect.top) / rect.height) * 100)
  }
  const leave = () => { rX.set(0); rY.set(0); sX.set(50); sY.set(50) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      whileHover={{ zIndex: 10 }}
      style={{ ...style, rotateX: srX, rotateY: srY, transformStyle: 'preserve-3d', perspective: 800, position: 'relative', overflow: 'hidden' }}
    >
      {children}
      {/* Shine overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at ${shine[0]}% ${shine[1]}%, rgba(201,169,110,0.18) 0%, rgba(201,169,110,0.05) 40%, transparent 70%)`,
      }} />
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   EFFECT 3 ╌ GlassCard
   True glassmorphism: blur, tinted BG, white
   border, inner highlight. Hover: glow + scale.
════════════════════════════════════════════ */
const GlassCard = ({ children, style }) => (
  <motion.div
    className="hoverable"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px 0px' }}
    transition={{ duration: .7, ease: [.22, 1, .36, 1] }}
    whileHover={{
      scale: 1.04,
      boxShadow: `0 32px 80px rgba(201,169,110,0.22), 0 0 0 1px rgba(201,169,110,0.35), inset 0 0 40px rgba(201,169,110,0.05)`,
      y: -6,
    }}
    style={{
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      background: 'rgba(250,248,243,0.5)',
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
      borderRadius: 4, ...style,
    }}
  >
    {children}
  </motion.div>
)

/* ════════════════════════════════════════════
   EFFECT 4 ╌ RadiusOnScroll
   borderRadius 0 → 40px + scale 0.92 → 1
   synced to scroll progress.
════════════════════════════════════════════ */
const RadiusOnScroll = ({ children, style }) => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'center 50%'] })
  const br = useTransform(scrollYProgress, [0, 1], ['0px', '40px'])
  const sc = useTransform(scrollYProgress, [0, 1], [0.88, 1])
  const op = useTransform(scrollYProgress, [0, .3, 1], [0, 0.4, 1])

  return (
    <motion.div ref={ref} style={{ ...style, borderRadius: br, scale: sc, opacity: op, overflow: 'hidden', transformOrigin: 'center center' }}>
      {children}
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   EFFECT 5 ╌ MotionLayerScroller
   3 parallax depth layers. bg=slow, text=mid,
   deco=fast. Opacity fades in/out at edges.
════════════════════════════════════════════ */
const MotionLayerScroller = () => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  const y1 = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])    // bg  — 0.3×
  const y2 = useTransform(scrollYProgress, [0, 1], ['-30%', '30%'])   // text — 0.6×
  const y3 = useTransform(scrollYProgress, [0, 1], ['-50%', '50%'])   // line — 1.0×
  const op = useTransform(scrollYProgress, [0, .2, .8, 1], [0, 1, 1, 0])

  return (
    <div ref={ref} style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden', background: C.charcoal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Layer 1 — Ocean Parallax Image */}
      <motion.div style={{ position: 'absolute', inset: '-20%', y: y1, pointerEvents: 'none' }}>
        <img src={imgParallaxOcean} alt="Ocean" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #1A1814 0%, transparent 20%, transparent 80%, #0D0C0A 100%)' }} />
      </motion.div>

      {/* Layer 2 — quote text (medium speed) */}
      <motion.div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 48px', y: y2, opacity: op }}>
        <motion.p
          initial={{ letterSpacing: '8px', opacity: 0 }}
          whileInView={{ letterSpacing: '6px', opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 'inherit', textTransform: 'uppercase', color: C.gold, marginBottom: 36 }}
        >
          Our Promise
        </motion.p>
        <blockquote style={{
          fontFamily: F.display,
          fontSize: 'clamp(38px,6.5vw,84px)',
          fontWeight: 300, fontStyle: 'italic',
          lineHeight: 1.05, color: C.warmWhite,
          maxWidth: 980,
        }}>
          Where the ocean meets&nbsp;the&nbsp;table
        </blockquote>
      </motion.div>

      {/* Layer 3 — decorative gold line (fastest) */}
      <motion.div style={{ position: 'absolute', zIndex: 3, y: y3, opacity: op, bottom: 'calc(50% - 120px)', left: '50%', translateX: '-50%' }}>
        <motion.div
          initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [.22, 1, .36, 1] }}
          style={{ width: 80, height: 1, background: C.gold, transformOrigin: 'center' }}
        />
      </motion.div>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,12,10,.5) 0%, transparent 30%, transparent 70%, rgba(13,12,10,.5) 100%)', pointerEvents: 'none' }} />
    </div>
  )
}

/* ════════════════════════════════════════════
   STAGGER REVEAL HELPERS
════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 56, scale: .97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: .8, ease: [.22, 1, .36, 1] }
  },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: .12, delayChildren: .05 } } }

const Reveal = ({ children, delay = 0, style, className }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })
  return (
    <motion.div
      ref={ref} style={style} className={className}
      initial="hidden" animate={inView ? 'show' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: .8, ease: [.22, 1, .36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

const StaggerWrap = ({ children, style, className }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })
  return (
    <motion.div ref={ref} style={style} className={className} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}>
      {children}
    </motion.div>
  )
}
const StaggerItem = ({ children, style, className }) => (
  <motion.div style={style} className={className} variants={fadeUp}>{children}</motion.div>
)

/* ════════════════════════════════════════════
   ANIMATED COUNTER
════════════════════════════════════════════ */
const Counter = ({ to, suffix = '' }) => {
  const ref = useRef(null)
  const nodeRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate(v) { if (nodeRef.current) nodeRef.current.textContent = Math.round(v) + suffix },
    })
    return controls.stop
  }, [inView])
  return <span ref={ref}><span ref={nodeRef}>0{suffix}</span></span>
}

/* ════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════ */
const Navbar = () => {
  const { scrollY } = useScroll()
  const bg = useTransform(scrollY, [0, 70], ['rgba(250,248,243,0)', 'rgba(250,248,243,0.97)'])
  const sdw = useTransform(scrollY, [0, 70], ['0 0 0 rgba(0,0,0,0)', `0 1px 0 ${C.border}`])

  const [logoC, setLogoC] = useState(C.warmWhite)
  const [linkC, setLinkC] = useState('rgba(250,248,243,0.8)')
  const [py, setPy] = useState(24)

  useEffect(() => scrollY.on('change', v => {
    const t = v > 60
    setPy(t ? 14 : 24)
    setLogoC(t ? C.charcoal : C.warmWhite)
    setLinkC(t ? C.muted : 'rgba(250,248,243,0.82)')
  }), [])

  const links = [['#about', 'Our Story'], ['#menu', 'Menu'], ['#experience', 'Experience'], ['#reserve', 'Contact']]

  return (
    <motion.nav
      className="mobile-nav-hide"
      initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: .9, ease: [.22, 1, .36, 1] }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: `${py}px 60px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bg, boxShadow: sdw, transition: 'padding .4s', backdropFilter: 'blur(1px)' }}
    >
      <a href="#" className="nl hoverable" style={{ fontFamily: F.display, fontSize: 22, fontWeight: 300, letterSpacing: 3, color: logoC, textTransform: 'uppercase', textDecoration: 'none', transition: 'color .4s' }}>
        Saffron &amp; Sea
      </a>
      <ul className="hide-m" style={{ display: 'flex', gap: 40, listStyle: 'none' }}>
        {links.map(([h, l]) => (
          <li key={h}>
            <a href={h} className="nl hoverable" style={{ fontFamily: F.label, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: linkC, transition: 'color .4s', textDecoration: 'none' }}>{l}</a>
          </li>
        ))}
      </ul>
      <motion.a href="#reserve" className="hoverable hide-m"
        whileHover={{ background: C.gold, color: C.charcoal }}
        style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.gold, border: `1px solid ${C.gold}`, padding: '10px 26px', textDecoration: 'none', transition: 'all .3s' }}
      >
        Reserve a Table
      </motion.a>
    </motion.nav>
  )
}

/* ════════════════════════════════════════════
   HERO  — CursorMaskReveal on headline,
   animated tagline, draw-in gold line,
   staggered entrance
════════════════════════════════════════════ */
const Hero = () => (
  <AuroraBackground style={{ height: '100vh', minHeight: 700, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>

      {/* Tagline slides down */}
      <motion.p
        initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .9, delay: .2, ease: [.22, 1, .36, 1] }}
        style={{ fontFamily: F.label, fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', color: C.gold, marginBottom: 32 }}
      >
        Coastal Fine Dining · Est. 2019
      </motion.p>

      {/* ── EFFECT 1: CursorMaskReveal ── */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: .45, ease: [.22, 1, .36, 1] }}>
        <CursorMaskReveal>
          <h1 className="hero-title" style={{ fontFamily: F.display, fontSize: 'clamp(72px,12vw,148px)', fontWeight: 300, lineHeight: .88, color: C.warmWhite, letterSpacing: '-1px', userSelect: 'none' }}>
            Saffron<br />
            <em style={{ fontStyle: 'italic' }}>&amp; Sea</em>
          </h1>
        </CursorMaskReveal>
      </motion.div>

      {/* Gold divider — scaleX draw-in */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay: 1.05, ease: [.22, 1, .36, 1] }}
        style={{ width: 1, height: 64, background: `linear-gradient(to bottom,transparent,${C.gold},transparent)`, margin: '36px auto', originY: 'top' }}
      />

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: 1.3 }}
        style={{ fontFamily: F.body, fontSize: 15, fontWeight: 300, letterSpacing: .8, color: 'rgba(250,248,243,0.45)' }}>
        Where the ocean meets the table
      </motion.p>

      <motion.a
        href="#menu" className="hoverable"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: 1.55 }}
        whileHover={{ y: -4, backgroundColor: C.goldLight, letterSpacing: '4px' }}
        style={{ display: 'inline-block', marginTop: 44, fontFamily: F.label, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: C.charcoal, background: C.gold, padding: '17px 48px', textDecoration: 'none', transition: 'background .3s, letter-spacing .4s' }}
      >
        Explore the Menu
      </motion.a>
    </div>

    {/* Scroll hint */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
      style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: F.label, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(250,248,243,0.25)' }}>Scroll</span>
      <div className="sp" style={{ width: 1, height: 44, background: `linear-gradient(to bottom,${C.gold},transparent)` }} />
    </motion.div>
  </AuroraBackground>
)

/* ════════════════════════════════════════════
   ABOUT  — EFFECT 4 on image block
════════════════════════════════════════════ */
const About = () => {
  const stats = [{ num: 12, label: 'Courses' }, { num: 6, label: 'Years' }, { num: 3, label: 'Awards' }]
  return (
    <section id="about" style={{ background: C.cream, padding: '130px 60px' }} className="pad-m">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 88, alignItems: 'center' }} className="col1-m">

        {/* ── EFFECT 4: RadiusOnScroll ── */}
        <div className="about-img-wrap" style={{ position: 'relative', height: 600 }}>
          {/* Portrait behind */}
          <motion.div
            className="about-portrait-behind"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 }}
            style={{ position: 'absolute', top: -40, left: -40, width: '60%', height: '80%', zIndex: 0 }}
          >
            <img src={imgAboutPortrait} alt="Chef" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          </motion.div>

          <RadiusOnScroll style={{ position: 'absolute', top: 40, right: 0, width: '85%', height: '100%', zIndex: 1, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <img src={imgAboutDish} alt="Fine dining dish" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* subtle golden overlay at bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(26,24,20,0.8), transparent)' }} />
            
            {/* Gold accent box */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: .9, delay: .3, ease: [.22, 1, .36, 1] }}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '54%', height: '140px', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontFamily: F.display, fontSize: 19, fontStyle: 'italic', color: C.charcoal, opacity: .72 }}>"Since 2019"</span>
            </motion.div>
          </RadiusOnScroll>
        </div>

        {/* Text stagger */}
        <StaggerWrap>
          <StaggerItem><p style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Our Philosophy</p></StaggerItem>
          <StaggerItem>
            <h2 style={{ fontFamily: F.display, fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, lineHeight: 1.08, color: C.charcoal, marginBottom: 28 }}>
              Crafted with<br /><em style={{ fontStyle: 'italic', color: C.terra }}>intention</em>
            </h2>
          </StaggerItem>
          <StaggerItem><p style={{ fontSize: 15, lineHeight: 1.95, color: C.muted, fontWeight: 300, marginBottom: 20 }}>Every dish at Saffron &amp; Sea is a conversation between land and ocean — built on the finest coastal ingredients, guided by years of classical training, and finished with restraint.</p></StaggerItem>
          <StaggerItem><p style={{ fontSize: 15, lineHeight: 1.95, color: C.muted, fontWeight: 300 }}>We believe that great dining is not about abundance, but about precision. A single perfect ingredient, prepared with care, says more than a plate overcrowded with complexity.</p></StaggerItem>
          <StaggerItem>
            <div style={{ display: 'flex', gap: 44, marginTop: 48, paddingTop: 48, borderTop: `1px solid ${C.border}` }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: F.display, fontSize: 56, fontWeight: 300, color: C.gold, lineHeight: 1 }}>
                    <Counter to={s.num} />
                  </div>
                  <div style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginTop: 8 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </StaggerItem>
        </StaggerWrap>

      </div>
    </section>
  )
}

/* ════════════════════════════════════════════
   MARQUEE STRIP
════════════════════════════════════════════ */
const MarqueeStrip = () => {
  const content = "Fine Dining · Est. 2019 · Coastal · Saffron & Sea · Handcrafted · ".repeat(6)
  return (
    <div style={{ background: C.gold, height: 48, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <div style={{ display: 'flex', width: '200%' }}>
        <p className="marquee" style={{ fontFamily: F.label, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: C.charcoal, minWidth: '100%', whiteSpace: 'nowrap', paddingRight: 3 }}>{content}</p>
        <p className="marquee" style={{ fontFamily: F.label, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: C.charcoal, minWidth: '100%', whiteSpace: 'nowrap', paddingRight: 3 }}>{content}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   MENU  — EFFECT 2 MomentumCard on each dish
════════════════════════════════════════════ */
const DISHES = [
  { cat: 'starter', name: 'Scallop Crudo', desc: 'Day-boat scallop, yuzu emulsion, micro shiso, Adriatic sea salt', price: '$24', tag: 'Raw Bar' },
  { cat: 'starter', name: 'Saffron Bisque', desc: 'Lobster shell broth, saffron bloom, cognac, crème fraîche quenelle', price: '$28', tag: 'Signature' },
  { cat: 'starter', name: 'Burrata & Heirloom', desc: 'Stone-ground burrata, heritage tomato, 25-yr balsamic, basil oil', price: '$22', tag: 'Vegetarian' },
  { cat: 'main', name: 'Miso Black Cod', desc: '72-hour miso-marinated cod, dashi beurre blanc, pickled daikon, capers', price: '$58', tag: "Chef's Pick" },
  { cat: 'main', name: 'Dry-Aged Duck', desc: '21-day Muscovy duck breast, cherry jus, celeriac purée, watercress', price: '$64', tag: 'Seasonal' },
  { cat: 'dessert', name: 'Valrhona Soufflé', desc: 'Dark chocolate soufflé, Tahitian vanilla ice cream, salted caramel', price: '$18', tag: 'Allow 20 min' },
]

const DishCard = ({ dish, index }) => {
  const [hov, setHov] = useState(false)
  const catLabel = { starter: 'Starter', main: 'Main Course', dessert: 'Dessert' }[dish.cat]
  return (
    <Reveal delay={index * 0.06}>
      {/* ── EFFECT 2: MomentumCard ── */}
      <MomentumCard
        style={{ padding: '38px 32px', background: hov ? 'rgba(201,169,110,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid rgba(201,169,110,${hov ? .15 : .07})`, transition: 'background .4s, border-color .4s', cursor: 'default' }}
      >
        <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}>
          {/* Left accent bar */}
          <motion.div animate={{ height: hov ? '100%' : 0 }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }}
            style={{ position: 'absolute', top: 0, left: 0, width: 2, background: C.gold, borderRadius: 1 }} />

          <p style={{ fontFamily: F.label, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.gold, marginBottom: 14 }}>{catLabel}</p>
          <h3 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 400, color: C.warmWhite, marginBottom: 10, lineHeight: 1.15 }}>{dish.name}</h3>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.82, fontWeight: 300, marginBottom: 26 }}>{dish.desc}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: F.display, fontSize: 24, color: C.goldLight }}>{dish.price}</span>
            <span style={{ fontFamily: F.label, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.sage, border: `1px solid ${C.sage}`, padding: '5px 11px' }}>{dish.tag}</span>
          </div>
        </motion.div>
      </MomentumCard>
    </Reveal>
  )
}

/* ════════════════════════════════════════════
   MOBILE MENU DECK
════════════════════════════════════════════ */
const MobileMenuDeck = ({ dishes }) => {
  const [index, setIndex] = useState(0)

  // Reset to 0 whenever dishes (filter) changes
  const prevDishRef = useRef(dishes)
  useEffect(() => {
    if (prevDishRef.current !== dishes) {
      setIndex(0)
      prevDishRef.current = dishes
    }
  }, [dishes])

  // We reverse the array up to current index + 2
  const visibleCards = [index, index + 1, index + 2].filter(i => i < dishes.length).reverse()

  return (
    <div>
      <div style={{ position: 'relative', height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 16px' }}>
        
        {/* Ghost arrows */}
        <button onClick={() => setIndex(prev => Math.max(0, prev - 1))} style={{ position: 'absolute', left: 0, zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button onClick={() => setIndex(prev => Math.min(dishes.length - 1, prev + 1))} style={{ position: 'absolute', right: 0, zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <AnimatePresence>
          {visibleCards.map((i) => (
            <MobileMenuCard key={i} dish={dishes[i]} index={i} currentIndex={index} total={dishes.length} setIndex={setIndex} />
          ))}
        </AnimatePresence>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <p style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 3, color: C.muted }}>{index + 1} / {dishes.length}</p>
        {index === dishes.length - 1 && (
          <button onClick={() => setIndex(0)} style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 2, color: C.gold, border: 'none', background: 'transparent', marginTop: 12, textTransform: 'uppercase', padding: '8px 16px', border: `1px solid ${C.gold}`, borderRadius: 4 }}>Start Over</button>
        )}
      </div>
    </div>
  )
}

const MobileMenuCard = ({ dish, index, currentIndex, total, setIndex }) => {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-150, 0, 150], [-18, 0, 18])
  const dragScale = useTransform(x, [-100, 0, 100], [0.85, 1, 0.85])

  const isFront = index === currentIndex
  const offset = index - currentIndex

  // offset scale and y
  const sc = offset === 0 ? 1 : offset === 1 ? 0.94 : 0.88
  const yOff = offset === 0 ? 0 : offset === 1 ? 16 : 32
  const op = offset === 0 ? 1 : offset === 1 ? 0.7 : 0.4

  const onDragEnd = (e, info) => {
    if (info.offset.x < -80 || info.offset.x > 80) {
      setIndex(prev => Math.min(prev + 1, total - 1))
    }
  }

  // Swipe hint on first render
  const animProps = isFront && currentIndex === 0 ? {
    x: [0, -30, 0], transition: { delay: 1.2, duration: 0.8, ease: "easeInOut" }
  } : {}

  return (
    <motion.div
      style={{
        position: 'absolute', width: '100%', maxWidth: 360, zIndex: 5 - offset,
        x: isFront ? x : 0, rotate: isFront ? rotate : 0,
        scale: isFront ? dragScale : sc,
      }}
      initial={{ scale: sc, y: yOff, opacity: op }}
      animate={{ scale: sc, y: yOff, opacity: op }}
      exit={{ x: x.get() > 0 ? 500 : -500, opacity: 0, rotate: x.get() > 0 ? 22 : -22, transition: { duration: 0.35, ease: [0.32, 0, 0.67, 0] } }}
      transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.12}
      onDragEnd={onDragEnd}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(26,24,20,0.98), rgba(13,12,10,1))',
        border: '1px solid rgba(201,169,110,0.15)',
        borderRadius: 20, padding: '36px 28px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,110,0.08)',
        pointerEvents: 'none'
      }}>
        <p style={{ fontFamily: F.label, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.gold, marginBottom: 14 }}>
          {{ starter: 'Starter', main: 'Main Course', dessert: 'Dessert' }[dish.cat]}
        </p>
        <h3 style={{ fontFamily: F.display, fontSize: 34, fontWeight: 300, color: C.warmWhite, lineHeight: 1.1 }}>{dish.name}</h3>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.muted, lineHeight: 1.85, marginTop: 12 }}>{dish.desc}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
          <span style={{ fontFamily: F.display, fontSize: 28, color: C.goldLight }}>{dish.price}</span>
          <span style={{ fontFamily: F.label, fontSize: 9, border: `1px solid ${C.sage}`, color: C.sage, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase' }}>{dish.tag}</span>
        </div>
      </div>
    </motion.div>
  )
}

const Menu = () => {
  const [active, setActive] = useState('all')
  const tabs = ['all', 'starter', 'main', 'dessert']
  const tabLabel = { all: 'All', starter: 'Starters', main: 'Mains', dessert: 'Desserts' }
  const shown = active === 'all' ? DISHES : DISHES.filter(d => d.cat === active)

  const isMobile = useIsMobile()

  return (
    <section id="menu" style={{ background: C.charcoal, padding: '130px 60px', position: 'relative', overflow: 'hidden' }} className="pad-m">
      {/* Background Parallax Image */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', opacity: 0.15, pointerEvents: 'none' }}>
        <img src={imgMenuSpread} alt="Menu Spread" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', WebkitMaskImage: 'linear-gradient(to left, black, transparent)', maskImage: 'linear-gradient(to left, black, transparent)' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 28, marginBottom: 64 }}>
          <StaggerWrap>
            <StaggerItem><p style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Seasonal Menu</p></StaggerItem>
            <StaggerItem>
              <h2 style={{ fontFamily: F.display, fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, lineHeight: 1.08, color: C.warmWhite }}>
                Tonight's<br /><em style={{ fontStyle: 'italic', color: C.terra }}>Selection</em>
              </h2>
            </StaggerItem>
          </StaggerWrap>

          <Reveal>
            <div style={{ display: 'flex', gap: 3 }}>
              {tabs.map(t => (
                <button key={t} className="tab-btn hoverable" onClick={() => setActive(t)} style={{
                  fontFamily: F.label, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase',
                  padding: '11px 22px', cursor: 'pointer',
                  border: `1px solid ${active === t ? C.gold : 'rgba(201,169,110,0.28)'}`,
                  background: active === t ? C.gold : 'transparent',
                  color: active === t ? C.charcoal : C.muted,
                }}>
                  {tabLabel[t]}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <AnimatePresence mode="wait">
          {isMobile ? (
            <MobileMenuDeck dishes={shown} />
          ) : (
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }} className="col1-m">
                {shown.map((d, i) => <DishCard key={d.name} dish={d} index={i} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════
   EXPERIENCE  — dark dramatic layout
════════════════════════════════════════════ */
const EXP = [
  {
    num: '01', tag: 'Atmosphere',
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c2.2 0 4-1.8 4-4v-6H8v6c0 2.2 1.8 4 4 4z"/><path d="M12 12c-1.6 0-3-1.3-3-3 0-2.8 3-7 3-7s3 4.2 3 7c0 1.7-1.4 3-3 3z"/></svg>,
    title: 'Intimate Atmosphere',
    desc: '36 seats. Warm candlelight. A space designed for conversation, connection, and unhurried pleasure.',
    stat: '36', statLabel: 'Seats'
  },
  {
    num: '02', tag: 'Sommelier',
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M12 15a7.5 7.5 0 0 0 7.5-7.5C19.5 5 18 3 12 3S4.5 5 4.5 7.5 8 15 12 15z"/><path d="M4.5 7.5h15"/></svg>,
    title: 'Wine Pairing',
    desc: 'Our sommelier curates pairings from 400+ labels — organic naturals to rare Burgundy vintages.',
    stat: '400+', statLabel: 'Labels'
  },
  {
    num: '03', tag: 'Exclusive',
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>,
    title: "Chef's Table",
    desc: 'Sit at the pass. Watch every dish composed. An exclusive 8-seat counter with a 12-course tasting menu.',
    stat: '12', statLabel: 'Courses'
  },
]

const Experience = () => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const yImage = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])

  return (
    <section id="experience" ref={ref} style={{ background: C.charcoal, padding: '130px 60px', position: 'relative', overflow: 'hidden' }} className="pad-m">

      {/* Faint background image — mirroring Menu section */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', opacity: 0.12, pointerEvents: 'none' }}>
        <motion.div className="exp-parallax" style={{ position: 'absolute', inset: '-15%', y: yImage }}>
          <img src={imgExpInterior} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', WebkitMaskImage: 'linear-gradient(to right, black, transparent)', maskImage: 'linear-gradient(to right, black, transparent)' }} />
        </motion.div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>

        {/* Header — same rhythm as Menu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 28, marginBottom: 80 }}>
          <StaggerWrap>
            <StaggerItem><p style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>The Experience</p></StaggerItem>
            <StaggerItem>
              <h2 style={{ fontFamily: F.display, fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, lineHeight: 1.08, color: C.warmWhite }}>
                More than a<br /><em style={{ fontStyle: 'italic', color: C.terra }}>a meal</em>
              </h2>
            </StaggerItem>
          </StaggerWrap>
          <Reveal>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.muted, fontWeight: 300, maxWidth: 320, lineHeight: 1.9 }}>
              Every visit to Saffron &amp; Sea is orchestrated — not just a dinner, but a complete sensory journey from arrival to the final pour.
            </p>
          </Reveal>
        </div>

        {/* Numbered rows — bold horizontal cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {EXP.map((e, i) => (
            <Reveal key={e.num} delay={i * 0.1}>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(201,169,110,0.04)', x: 6 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 56px 1fr auto',
                  alignItems: 'center',
                  gap: 36,
                  padding: '36px 40px',
                  border: '1px solid rgba(201,169,110,0.1)',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="col1-m"
              >
                {/* Number */}
                <span style={{ fontFamily: F.display, fontSize: 52, fontWeight: 300, color: 'rgba(201,169,110,0.18)', lineHeight: 1 }}>{e.num}</span>

                {/* Animated icon */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {e.icon}
                </motion.div>

                {/* Title + desc */}
                <div>
                  <p style={{ fontFamily: F.label, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>{e.tag}</p>
                  <h3 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 300, color: C.warmWhite, marginBottom: 10, lineHeight: 1.15 }}>{e.title}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.88, fontWeight: 300, maxWidth: 480 }}>{e.desc}</p>
                </div>

                {/* Stat */}
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontFamily: F.display, fontSize: 48, fontWeight: 300, color: C.gold, lineHeight: 1 }}>{e.stat}</div>
                  <div style={{ fontFamily: F.label, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginTop: 6 }}>{e.statLabel}</div>
                </div>

                {/* Left gold bar on hover */}
                <motion.div
                  initial={{ scaleY: 0 }} whileHover={{ scaleY: 1 }}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: C.gold, transformOrigin: 'top', borderRadius: 1 }}
                />
              </motion.div>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA — mirrors Menu's Reserve a Table feel */}
        <Reveal delay={0.3}>
          <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
            <motion.a
              href="#reserve"
              whileHover={{ y: -4, backgroundColor: C.goldLight, letterSpacing: '4px' }}
              style={{ display: 'inline-block', fontFamily: F.label, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: C.charcoal, background: C.gold, padding: '17px 52px', textDecoration: 'none', transition: 'background .3s, letter-spacing .4s' }}
            >
              Reserve Your Evening
            </motion.a>
          </div>
        </Reveal>

      </div>
    </section>
  )
}

/* ════════════════════════════════════════════
   RESERVATION  — dark, animated form fields
════════════════════════════════════════════ */
const baseInput = {
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid rgba(201,169,110,0.22)`,
  padding: '14px 17px', color: C.warmWhite,
  fontSize: 14, outline: 'none', width: '100%',
  transition: 'border-color .3s, background .3s',
  appearance: 'none',
}
const onFoc = e => { e.target.style.borderColor = C.gold; e.target.style.background = 'rgba(201,169,110,0.06)' }
const onBlr = e => { e.target.style.borderColor = 'rgba(201,169,110,0.22)'; e.target.style.background = 'rgba(255,255,255,0.04)' }

const Field = ({ label, type = 'text', placeholder, full, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, gridColumn: full ? '1/-1' : 'auto' }}>
    <label style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.muted }}>{label}</label>
    {children || <input type={type} placeholder={placeholder} style={baseInput} onFocus={onFoc} onBlur={onBlr} />}
  </div>
)

const Reservation = () => (
  <section id="reserve" style={{ background: C.deep, padding: '130px 60px' }} className="pad-m">
    <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
      <Reveal><p style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>Book Your Evening</p></Reveal>
      <Reveal delay={.08}>
        <h2 style={{ fontFamily: F.display, fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, lineHeight: 1.08, color: C.warmWhite, marginBottom: 18 }}>
          Reserve a <em style={{ fontStyle: 'italic', color: C.terra }}>Table</em>
        </h2>
      </Reveal>
      <Reveal delay={.16}>
        <p style={{ fontSize: 14, color: C.muted, fontWeight: 300, marginBottom: 64 }}>We recommend booking at least two weeks in advance. For parties of 6 or more, please call us directly.</p>
      </Reveal>
      <Reveal delay={.2}>
        <form onSubmit={e => e.preventDefault()} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, textAlign: 'left' }} className="col1-m">
          <Field label="Full Name" placeholder="Your name" />
          <Field label="Email Address" type="email" placeholder="your@email.com" />
          <Field label="Date">
            <div style={{ position: 'relative' }}>
              <input type="date" style={baseInput} onFocus={onFoc} onBlur={onBlr} />
              <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
          </Field>
          <Field label="Guests">
            <select style={{ ...baseInput, cursor: 'pointer' }} onFocus={onFoc} onBlur={onBlr}>
              {[2, 3, 4, 5].map(n => <option key={n} style={{ background: C.deep }}>{n} guests</option>)}
            </select>
          </Field>
          <Field label="Preferred Time">
            <select style={{ ...baseInput, cursor: 'pointer' }} onFocus={onFoc} onBlur={onBlr}>
              {['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map(t => <option key={t} style={{ background: C.deep }}>{t}</option>)}
            </select>
          </Field>
          <Field label="Occasion">
            <select style={{ ...baseInput, cursor: 'pointer' }} onFocus={onFoc} onBlur={onBlr}>
              {['No special occasion', 'Anniversary', 'Birthday', 'Business Dinner', 'Proposal'].map(o => <option key={o} style={{ background: C.deep }}>{o}</option>)}
            </select>
          </Field>
          <Field label="Special Requests" full>
            <textarea placeholder="Dietary requirements, allergies, or special arrangements..." style={{ ...baseInput, minHeight: 110 }} onFocus={onFoc} onBlur={onBlr} />
          </Field>
          <div style={{ gridColumn: '1/-1' }}>
            <motion.button type="submit" className="hoverable"
              whileHover={{ y: -3, backgroundColor: C.goldLight }}
              whileTap={{ scale: .97 }}
              style={{ width: '100%', padding: 20, border: 'none', fontFamily: F.label, fontSize: 11, letterSpacing: 3.5, textTransform: 'uppercase', color: C.charcoal, background: C.gold, cursor: 'pointer', marginTop: 8, transition: 'background .3s' }}
            >
              Confirm Reservation
            </motion.button>
          </div>
        </form>
      </Reveal>
    </div>
  </section>
)

/* ════════════════════════════════════════════
   FOOTER
════════════════════════════════════════════ */
const Footer = () => (
  <footer style={{ position: 'relative', overflow: 'hidden', background: C.deep, borderTop: `1px solid rgba(201,169,110,0.1)`, padding: '64px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 28 }}>
    <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', fontFamily: F.display, fontSize: 'clamp(80px, 18vw, 220px)', fontWeight: 300, color: 'rgba(201,169,110,0.04)', letterSpacing: 16, textTransform: 'uppercase', whiteSpace: 'nowrap', zIndex: 0, pointerEvents: 'none' }}>
      SAFFRON
    </div>
    <div style={{ position: 'relative', zIndex: 1, fontFamily: F.display, fontSize: 28, fontWeight: 300, letterSpacing: 4, color: C.warmWhite, textTransform: 'uppercase' }}>
      Saffron <span style={{ color: C.gold }}>&amp;</span> Sea
    </div>
    <nav style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 36 }}>
      {[['#about', 'Story'], ['#menu', 'Menu'], ['#experience', 'Experience'], ['#reserve', 'Reserve']].map(([h, l]) => (
        <a key={h} href={h} className="nl hoverable" style={{ fontFamily: F.label, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, textDecoration: 'none', transition: 'color .3s' }}
          onMouseEnter={e => e.target.style.color = C.gold} onMouseLeave={e => e.target.style.color = C.muted}
        >{l}</a>
      ))}
    </nav>
    <p style={{ position: 'relative', zIndex: 1, fontSize: 12, color: 'rgba(140,130,120,0.38)', fontFamily: F.body }}>© 2025 Saffron &amp; Sea. All rights reserved.</p>
  </footer>
)

/* ════════════════════════════════════════════
   MOBILE NAV
════════════════════════════════════════════ */
const MobileNav = () => {
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const sections = [
      { id: 'home', el: document.body },
      { id: 'menu', el: document.getElementById('menu') },
      { id: 'experience', el: document.getElementById('experience') },
      { id: 'reserve', el: document.getElementById('reserve') },
    ]
    const observer = new IntersectionObserver((entries) => {
      let active = null
      entries.forEach(e => {
        if (e.isIntersecting) {
          const sectionId = e.target === document.body ? 'home' : e.target.id
          active = sectionId
        }
      })
      if (active) setActiveSection(active)
    }, { threshold: 0.2, rootMargin: '-20% 0px -20% 0px' })
    
    sections.forEach(s => {
      if (s.el) observer.observe(s.el)
    })
    return () => observer.disconnect()
  }, [])

  const navs = [
    { id: 'home', label: 'Home', href: '#', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> },
    { id: 'menu', label: 'Menu', href: '#menu', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg> },
    { id: 'experience', label: 'Dine', href: '#experience', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M12 15a7.5 7.5 0 0 0 7.5-7.5C19.5 5 18 3 12 3S4.5 5 4.5 7.5 8 15 12 15z"/><path d="M4.5 7.5h15"/></svg> },
    { id: 'reserve', label: 'Reserve', href: '#reserve', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
  ]

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 2.4, duration: 0.6, ease: [.22, 1, .36, 1] }}
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'rgba(13,12,10,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(201,169,110,0.15)', padding: '12px 0 20px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}
    >
      {navs.map(n => {
        const isActive = activeSection === n.id
        return (
          <a key={n.id} href={n.href} onClick={(e) => {
            if (n.href === '#') { e.preventDefault(); window.scrollTo(0,0) }
            setActiveSection(n.id)
          }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none', color: isActive ? C.gold : 'rgba(140,130,120,0.5)', transition: 'color 0.3s' }}>
            <motion.div animate={{ scaleX: isActive ? 1 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} style={{ width: 20, height: 1.5, background: C.gold, marginBottom: 2 }} />
            {n.icon}
            <span style={{ fontFamily: F.label, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>{n.label}</span>
          </a>
        )
      })}
    </motion.nav>
  )
}

/* ════════════════════════════════════════════
   APP ROOT
════════════════════════════════════════════ */
export default function App() {
  const isMobile = useIsMobile()
  return (
    <>
      <Globals />
      {!isMobile && <Cursor />}
      <Navbar />
      <main>
        <Hero />
        <About />
        <MarqueeStrip />
        <Menu />
        <Experience />
        <MotionLayerScroller />
        <Reservation />
      </main>
      <Footer />
      {isMobile && <MobileNav />}
    </>
  )
}
