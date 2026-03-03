/**
 * Cloud Particles Module
 * Lusk.cloud Landing Page
 *
 * Canvas-based particle system that renders drifting cloud shapes.
 * Each cloud is pre-rendered as a blobby silhouette on an offscreen
 * canvas so it reads as a fluffy cloud rather than a circle.
 * Mouse interaction causes nearby clouds to scatter and dissipate.
 * Respects prefers-reduced-motion.
 */

(function () {
  'use strict';

  /* ------------------------------------------------
   * Configuration
   * ---------------------------------------------- */
  const CFG = {
    /** Number of clouds */
    count: 20,
    /** Base horizontal drift speed (px / frame) */
    driftSpeed: 0.25,
    /** Vertical wobble amplitude (px) */
    wobbleAmp: 0.12,
    /** Mouse influence radius (px) */
    mouseRadius: 180,
    /** How hard the mouse pushes clouds */
    mousePush: 5,
    /** How quickly clouds return to normal after push */
    friction: 0.94,
    /** Opacity recovery speed per frame */
    opacityRecovery: 0.003,
    /** Min / max cloud width */
    widthMin: 120,
    widthMax: 320,
    /** Min / max base opacity */
    opacityMin: 0.1,
    opacityMax: 0.4,
  };

  /* ------------------------------------------------
   * State
   * ---------------------------------------------- */
  let canvas, ctx;
  const clouds = [];
  const mouse = { x: -9999, y: -9999 };
  let animId = null;
  let paused = false;
  let frame = 0;

  /* ------------------------------------------------
   * Offscreen cloud texture generator
   *
   * Builds a blobby cloud silhouette by drawing many
   * overlapping ellipses onto a small offscreen canvas,
   * then applying a heavy blur so the edges merge into
   * one soft, organic shape.
   * ---------------------------------------------- */
  function generateCloudTexture(cloudW) {
    const cloudH = cloudW * 0.5;
    const pad = 20;
    const texW = cloudW + pad * 2;
    const texH = cloudH + pad * 2;
    const off = document.createElement('canvas');
    off.width = texW;
    off.height = texH;
    const oc = off.getContext('2d');

    /* Centre of the texture */
    const cx = texW / 2;
    const cy = texH / 2;

    /* Draw the solid cloud shape — a flat bottom row of
       overlapping ellipses plus bumps on top */
    oc.fillStyle = '#fff';

    /* Base body — wide flat ellipse */
    oc.beginPath();
    oc.ellipse(cx, cy + cloudH * 0.1, cloudW * 0.42, cloudH * 0.28, 0, 0, Math.PI * 2);
    oc.fill();

    /* Bumps — 5-8 random ellipses clustered toward the top */
    const bumps = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < bumps; i++) {
      const bx = cx + (Math.random() - 0.5) * cloudW * 0.55;
      /* Bias bumps upward */
      const by = cy - Math.random() * cloudH * 0.35;
      const bw = cloudW * (0.12 + Math.random() * 0.18);
      const bh = bw * (0.6 + Math.random() * 0.4);
      oc.beginPath();
      oc.ellipse(bx, by, bw, bh, 0, 0, Math.PI * 2);
      oc.fill();
    }

    /* Heavy blur to merge everything into one soft shape */
    oc.filter = 'blur(12px)';
    oc.globalCompositeOperation = 'source-atop';
    oc.drawImage(off, 0, 0);
    oc.filter = 'none';
    oc.globalCompositeOperation = 'source-over';

    /* Second blur pass for extra softness */
    oc.filter = 'blur(8px)';
    oc.globalCompositeOperation = 'source-atop';
    oc.drawImage(off, 0, 0);
    oc.filter = 'none';
    oc.globalCompositeOperation = 'source-over';

    /* Apply radial fade so edges dissolve naturally */
    const fadeGrad = oc.createRadialGradient(cx, cy, 0, cx, cy, Math.max(texW, texH) * 0.5);
    fadeGrad.addColorStop(0, 'rgba(255,255,255,1)');
    fadeGrad.addColorStop(0.6, 'rgba(255,255,255,1)');
    fadeGrad.addColorStop(1, 'rgba(255,255,255,0)');
    oc.globalCompositeOperation = 'destination-in';
    oc.fillStyle = fadeGrad;
    oc.fillRect(0, 0, texW, texH);
    oc.globalCompositeOperation = 'source-over';

    return { canvas: off, w: texW, h: texH };
  }

  /* ------------------------------------------------
   * Cloud factory
   * ---------------------------------------------- */
  function createCloud(w, h, startOffscreen) {
    const cloudW = CFG.widthMin + Math.random() * (CFG.widthMax - CFG.widthMin);
    const tex = generateCloudTexture(cloudW);
    const baseOpacity = CFG.opacityMin + Math.random() * (CFG.opacityMax - CFG.opacityMin);

    return {
      x: startOffscreen ? -tex.w : Math.random() * (w + tex.w) - tex.w * 0.5,
      y: Math.random() * h,
      tex: tex,
      baseOpacity: baseOpacity,
      opacity: baseOpacity,
      speed: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
    };
  }

  /* ------------------------------------------------
   * Drawing
   * ---------------------------------------------- */
  function drawCloud(c) {
    ctx.globalAlpha = c.opacity;
    ctx.drawImage(c.tex.canvas, c.x - c.tex.w * 0.5, c.y - c.tex.h * 0.5);
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------
   * Physics tick
   * ---------------------------------------------- */
  function tick() {
    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];

      /* --- mouse repulsion --- */
      const dx = c.x - mouse.x;
      const dy = c.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CFG.mouseRadius && dist > 0) {
        const force = (1 - dist / CFG.mouseRadius) * CFG.mousePush;
        c.vx += (dx / dist) * force;
        c.vy += (dy / dist) * force;
        c.opacity = Math.max(0, c.opacity - 0.02);
      }

      /* --- apply velocity with friction --- */
      c.x += c.vx;
      c.y += c.vy;
      c.vx *= CFG.friction;
      c.vy *= CFG.friction;

      /* --- drift & wobble --- */
      c.x += CFG.driftSpeed * c.speed;
      c.y += Math.sin(frame * 0.008 + c.phase) * CFG.wobbleAmp;

      /* --- recover opacity --- */
      if (c.opacity < c.baseOpacity) {
        c.opacity = Math.min(c.baseOpacity, c.opacity + CFG.opacityRecovery);
      }

      /* --- wrap around right edge --- */
      if (c.x - c.tex.w * 0.5 > w) {
        c.x = -c.tex.w * 0.5;
        c.y = Math.random() * h;
        c.opacity = c.baseOpacity;
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
    for (let i = 0; i < clouds.length; i++) {
      drawCloud(clouds[i]);
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
    hero.appendChild(canvas);

    ctx = canvas.getContext('2d');

    requestAnimationFrame(function () {
      resize();

      if (canvas.width > 0 && canvas.height > 0) {
        for (let i = 0; i < CFG.count; i++) {
          clouds.push(createCloud(canvas.width, canvas.height, false));
        }
      }

      initVisibilityObserver();
      render();
    });

    hero.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

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
