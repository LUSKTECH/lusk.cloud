/**
 * Cloud Particles Module
 * Lusk.cloud Landing Page
 *
 * Canvas-based particle system that renders drifting cloud puffs.
 * Mouse interaction causes nearby particles to scatter and dissipate.
 * Respects prefers-reduced-motion.
 */

(function () {
  'use strict';

  /* ------------------------------------------------
   * Configuration
   * ---------------------------------------------- */
  const CFG = {
    /** Number of clouds */
    count: 25,
    /** Lobes per cloud (overlapping circles that form the shape) */
    lobesMin: 4,
    lobesMax: 7,
    /** Base horizontal drift speed (px / frame) */
    driftSpeed: 0.3,
    /** Vertical wobble amplitude (px) */
    wobbleAmp: 0.15,
    /** Mouse influence radius (px) */
    mouseRadius: 180,
    /** How hard the mouse pushes clouds */
    mousePush: 5,
    /** How quickly clouds return to normal after push */
    friction: 0.94,
    /** Opacity recovery speed per frame */
    opacityRecovery: 0.003,
    /** Min / max cloud base radius (lobes scatter around this) */
    radiusMin: 40,
    radiusMax: 110,
    /** Min / max base opacity */
    opacityMin: 0.12,
    opacityMax: 0.45,
  };

  /* ------------------------------------------------
   * State
   * ---------------------------------------------- */
  let canvas, ctx;
  const particles = [];
  const mouse = { x: -9999, y: -9999 };
  let animId = null;
  let paused = false;

  /* ------------------------------------------------
   * Particle factory
   * ---------------------------------------------- */
  function createParticle(w, h, startOffscreen) {
    const r = CFG.radiusMin + Math.random() * (CFG.radiusMax - CFG.radiusMin);
    const baseOpacity = CFG.opacityMin + Math.random() * (CFG.opacityMax - CFG.opacityMin);
    const lobeCount = CFG.lobesMin + Math.floor(Math.random() * (CFG.lobesMax - CFG.lobesMin + 1));

    /* Pre-generate lobe offsets so each cloud keeps its shape */
    const lobes = [];
    for (let i = 0; i < lobeCount; i++) {
      lobes.push({
        /** Offset from cloud centre */
        ox: (Math.random() - 0.5) * r * 1.2,
        oy: (Math.random() - 0.5) * r * 0.6,
        /** Each lobe has its own radius (50-90% of base) */
        lr: r * (0.5 + Math.random() * 0.4),
      });
    }

    return {
      x: startOffscreen ? -r * 2 : Math.random() * (w + r * 2) - r,
      y: Math.random() * h,
      r,
      lobes,
      baseOpacity,
      opacity: baseOpacity,
      speed: 0.5 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
    };
  }

  /* ------------------------------------------------
   * Drawing helpers
   * ---------------------------------------------- */

  /**
   * Draw a cloud as a cluster of overlapping soft radial-gradient circles.
   * This produces an organic, fluffy shape instead of a single ball.
   */
  function drawPuff(p) {
    for (let i = 0; i < p.lobes.length; i++) {
      const lobe = p.lobes[i];
      const lx = p.x + lobe.ox;
      const ly = p.y + lobe.oy;
      const lr = lobe.lr;
      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      grad.addColorStop(0, `rgba(255,255,255,${p.opacity * 0.8})`);
      grad.addColorStop(0.35, `rgba(255,255,255,${p.opacity * 0.45})`);
      grad.addColorStop(0.7, `rgba(255,255,255,${p.opacity * 0.15})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ------------------------------------------------
   * Physics tick
   * ---------------------------------------------- */
  let frame = 0;

  function tick() {
    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      /* --- mouse repulsion --- */
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CFG.mouseRadius && dist > 0) {
        const force = (1 - dist / CFG.mouseRadius) * CFG.mousePush;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
        /* fade out when pushed */
        p.opacity = Math.max(0, p.opacity - 0.02);
      }

      /* --- apply velocity with friction --- */
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= CFG.friction;
      p.vy *= CFG.friction;

      /* --- drift & wobble --- */
      p.x += CFG.driftSpeed * p.speed;
      p.y += Math.sin(frame * 0.008 + p.phase) * CFG.wobbleAmp;

      /* --- recover opacity --- */
      if (p.opacity < p.baseOpacity) {
        p.opacity = Math.min(p.baseOpacity, p.opacity + CFG.opacityRecovery);
      }

      /* --- wrap around right edge --- */
      if (p.x - p.r > w) {
        p.x = -p.r * 2;
        p.y = Math.random() * h;
        p.opacity = p.baseOpacity;
      }
    }

    frame++;
  }

  /* ------------------------------------------------
   * Render loop
   * ---------------------------------------------- */
  function render() {
    if (paused) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tick();
    for (let i = 0; i < particles.length; i++) {
      drawPuff(particles[i]);
    }
    animId = requestAnimationFrame(render);
  }

  /* ------------------------------------------------
   * Resize handler
   * ---------------------------------------------- */
  function resize() {
    const hero = document.getElementById('hero');
    if (!hero || !canvas) {
      return;
    }
    const w = hero.offsetWidth;
    const h = hero.offsetHeight;
    if (w > 0 && h > 0) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  /* ------------------------------------------------
   * Visibility — pause when off-screen
   * ---------------------------------------------- */
  function initVisibilityObserver() {
    const hero = document.getElementById('hero');
    if (!hero || !('IntersectionObserver' in window)) {
      return;
    }
    const obs = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          if (paused) {
            paused = false;
            render();
          }
        } else {
          paused = true;
          if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        }
      },
      { threshold: 0 },
    );
    obs.observe(hero);
  }

  /* ------------------------------------------------
   * Bootstrap
   * ---------------------------------------------- */
  function init() {
    /* Respect reduced-motion */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const hero = document.getElementById('hero');
    if (!hero) {
      return;
    }

    canvas = document.createElement('canvas');
    canvas.className = 'cloud-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    /* Append to hero — z-index layering is handled entirely via CSS */
    hero.appendChild(canvas);

    ctx = canvas.getContext('2d');

    /* Defer initial sizing to ensure the hero has fully laid out */
    requestAnimationFrame(function () {
      resize();

      /* Seed particles only if canvas has dimensions */
      if (canvas.width > 0 && canvas.height > 0) {
        for (let i = 0; i < CFG.count; i++) {
          particles.push(createParticle(canvas.width, canvas.height, false));
        }
      }

      initVisibilityObserver();
      render();
    });
    /* Mouse tracking (relative to canvas) */
    hero.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    /* Touch support */
    hero.addEventListener(
      'touchmove',
      function (e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
      },
      { passive: true },
    );
    hero.addEventListener('touchend', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    window.addEventListener('resize', resize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
