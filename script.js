/**
 * AETHERIA: The Vertical Odyssey
 * Parallax Scrolling & Interactive Experience Engine
 * 60fps Hardware-Accelerated Transforms with GSAP ScrollTrigger & Web Audio API
 */

(function () {
  'use strict';

  // --- Reduced Motion Check ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- DOM Elements ---
  const header = document.querySelector('.site-header');
  const progressFill = document.getElementById('progress-fill');
  const hudAltitude = document.getElementById('hud-altitude');
  const hudStage = document.getElementById('hud-stage');
  const hudVelocity = document.getElementById('hud-velocity');
  const hudOxygen = document.getElementById('hud-oxygen');
  const audioToggleBtn = document.getElementById('audio-toggle');
  const audioStatusText = document.getElementById('audio-status');
  const previewFlightBtn = document.getElementById('preview-flight-btn');
  const transmitBtn = document.getElementById('transmit-btn');
  const relaunchBtn = document.getElementById('relaunch-btn');
  const dispatchToast = document.getElementById('dispatch-toast');
  const terminalOutput = document.getElementById('terminal-output');
  const ambientCanvas = document.getElementById('ambient-canvas');
  const canvasCtx = ambientCanvas.getContext('2d');
  const waypointDots = document.querySelectorAll('.waypoint-dot');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.parallax-section');

  // --- Dynamic Telemetry State ---
  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let currentVelocity = 0;
  let targetVelocity = 0;

  // Mouse Parallax Lerping State
  let mouseTargetX = 0;
  let mouseTargetY = 0;
  let mouseCurrentX = 0;
  let mouseCurrentY = 0;

  // =========================================================================
  // 1. SKY GRADIENT COLOR PALETTES FOR SMOOTH SCROLL INTERPOLATION
  // =========================================================================
  const skyPalettes = [
    { stop: 0.00, top: [26, 16, 47], mid: [94, 50, 89], bot: [255, 154, 118] },    // Dawn Valley
    { stop: 0.22, top: [14, 22, 38], mid: [30, 41, 59], bot: [56, 189, 248] },     // Alpine Ridge
    { stop: 0.48, top: [45, 19, 44], mid: [128, 19, 54], bot: [245, 158, 11] },    // Cloud Kingdom
    { stop: 0.75, top: [3, 7, 18], mid: [11, 25, 44], bot: [6, 182, 212] },        // Aurora Stratosphere
    { stop: 1.00, top: [3, 7, 18], mid: [6, 11, 24], bot: [10, 17, 40] }           // Celestial Cosmos
  ];

  function interpolateColor(colorA, colorB, factor) {
    const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * factor);
    const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * factor);
    const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function updateDynamicSkyGradient(progress) {
    let lower = skyPalettes[0];
    let upper = skyPalettes[skyPalettes.length - 1];

    for (let i = 0; i < skyPalettes.length - 1; i++) {
      if (progress >= skyPalettes[i].stop && progress <= skyPalettes[i + 1].stop) {
        lower = skyPalettes[i];
        upper = skyPalettes[i + 1];
        break;
      }
    }

    const range = upper.stop - lower.stop;
    const factor = range > 0 ? (progress - lower.stop) / range : 0;

    const sky1 = interpolateColor(lower.top, upper.top, factor);
    const sky2 = interpolateColor(lower.mid, upper.mid, factor);
    const sky3 = interpolateColor(lower.bot, upper.bot, factor);

    document.documentElement.style.setProperty('--active-sky-1', sky1);
    document.documentElement.style.setProperty('--active-sky-2', sky2);
    document.documentElement.style.setProperty('--active-sky-3', sky3);
  }

  // =========================================================================
  // 2. TELEMETRY & PROGRESS COMPUTATION
  // =========================================================================
  function calculateTelemetry(progress) {
    let altStr = '0 m';
    let stageStr = 'TROPOSPHERE';
    let oxyStr = '20.9%';

    if (progress < 0.20) {
      const p = progress / 0.20;
      const alt = Math.round(p * 3200);
      altStr = `${alt.toLocaleString()} m`;
      stageStr = 'TROPOSPHERE';
      oxyStr = `${(20.9 - p * 5.9).toFixed(1)}%`;
    } else if (progress < 0.45) {
      const p = (progress - 0.20) / 0.25;
      const alt = Math.round(3200 + p * 6300);
      altStr = `${alt.toLocaleString()} m`;
      stageStr = 'UPPER TROPO';
      oxyStr = `${(15.0 - p * 6.5).toFixed(1)}%`;
    } else if (progress < 0.70) {
      const p = (progress - 0.45) / 0.25;
      const alt = Math.round(9500 + p * 38500);
      altStr = `${(alt / 1000).toFixed(1)} km`;
      stageStr = 'STRATOSPHERE';
      oxyStr = `${(8.5 - p * 7.5).toFixed(1)}%`;
    } else if (progress < 0.90) {
      const p = (progress - 0.70) / 0.20;
      const alt = Math.round(48000 + p * 52000);
      altStr = `${(alt / 1000).toFixed(1)} km`;
      stageStr = 'THERMOSPHERE';
      oxyStr = '< 0.1%';
    } else {
      const p = (progress - 0.90) / 0.10;
      const alt = Math.round(100000 + p * 284400);
      altStr = `${alt.toLocaleString()} km`;
      stageStr = 'CIS-LUNAR VOID';
      oxyStr = '0.0% (VACUUM)';
    }

    return { altStr, stageStr, oxyStr };
  }

  function updateTelemetryAndHUD() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollY = window.scrollY;
    const progress = Math.max(0, Math.min(1, maxScroll > 0 ? scrollY / maxScroll : 0));

    // Update Progress Bar
    const percent = Math.round(progress * 100);
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', percent);
    }

    // Velocity calculation (km/h approximation)
    const now = performance.now();
    const dt = Math.max(1, now - lastScrollTime);
    const dy = Math.abs(scrollY - lastScrollY);
    const instantVelocity = (dy / dt) * 120; // scale factor
    targetVelocity = instantVelocity;
    currentVelocity += (targetVelocity - currentVelocity) * 0.15;

    lastScrollY = scrollY;
    lastScrollTime = now;

    const { altStr, stageStr, oxyStr } = calculateTelemetry(progress);

    if (hudAltitude) hudAltitude.textContent = altStr;
    if (hudStage) hudStage.textContent = stageStr;
    if (hudVelocity) hudVelocity.textContent = `${currentVelocity.toFixed(1)} km/h`;
    if (hudOxygen) hudOxygen.textContent = oxyStr;

    // Update dynamic sky colors
    updateDynamicSkyGradient(progress);

    // Update active nav and waypoint dots
    updateActiveNavIndicators();
  }

  function updateActiveNavIndicators() {
    const scrollPos = window.scrollY + window.innerHeight * 0.4;
    sections.forEach((sec, idx) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        waypointDots.forEach(dot => {
          dot.classList.toggle('active', dot.getAttribute('data-target') === id);
        });
        navItems.forEach(item => {
          item.classList.toggle('active', item.getAttribute('data-target') === id);
        });
      }
    });
  }

  // =========================================================================
  // 3. PARALLAX CORE WITH GSAP SCROLLTRIGGER (WITH FALLBACK ENGINE)
  // =========================================================================
  function initParallaxEngine() {
    if (prefersReducedMotion) return;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // --- A. Vertical Parallax Layers per Section ---
      sections.forEach(section => {
        const layers = section.querySelectorAll('.p-layer');
        layers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-speed')) || 0.5;
          // Calculate scrub offset based on speed
          const yDist = (speed - 0.5) * 320;

          gsap.fromTo(
            layer,
            { y: yDist, force3D: true },
            {
              y: -yDist,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.6
              }
            }
          );
        });

        // Story card reveal animation
        const card = section.querySelector('.card-reveal');
        if (card) {
          gsap.fromTo(
            card,
            { opacity: 0, y: 50, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }
      });

      // --- B. Section 4: Pinned Horizontal Scroll ---
      const stratoSection = document.getElementById('stratosphere');
      const track = document.getElementById('horizontal-track');
      if (stratoSection && track) {
        const panels = track.querySelectorAll('.horizontal-panel');
        const totalPanels = panels.length;

        gsap.to(track, {
          xPercent: -100 * (totalPanels - 1) / totalPanels,
          ease: 'none',
          scrollTrigger: {
            trigger: stratoSection,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${window.innerWidth * 2.2}`,
            anticipatePin: 1
          }
        });

        // Horizontal elements sub-parallax inside pinned section
        const satellite = document.querySelector('.satellite-object');
        if (satellite) {
          gsap.to(satellite, {
            x: -240,
            y: 40,
            rotation: 12,
            ease: 'none',
            scrollTrigger: {
              trigger: stratoSection,
              start: 'top top',
              end: () => `+=${window.innerWidth * 2.2}`,
              scrub: 1.2
            }
          });
        }

        const probe = document.querySelector('.probe-object');
        if (probe) {
          gsap.to(probe, {
            x: 180,
            y: -50,
            rotation: -8,
            ease: 'none',
            scrollTrigger: {
              trigger: stratoSection,
              start: 'top top',
              end: () => `+=${window.innerWidth * 2.2}`,
              scrub: 0.8
            }
          });
        }
      }

      // --- C. Hero & Final Section Specific Micro-Tweens ---
      const dawnSun = document.querySelector('.dawn-sun-container');
      if (dawnSun) {
        gsap.to(dawnSun, {
          y: 120,
          scale: 1.15,
          ease: 'none',
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5
          }
        });
      }

      const aerostat = document.getElementById('aerostat-ship');
      if (aerostat) {
        gsap.to(aerostat, {
          x: 180,
          y: -140,
          rotation: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: '#clouds',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5
          }
        });
      }

      const lunarOrb = document.querySelector('.lunar-orb-wrapper');
      if (lunarOrb) {
        gsap.to(lunarOrb, {
          y: -80,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: '#cosmos',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8
          }
        });
      }

      const astronaut = document.getElementById('spacewalker');
      if (astronaut) {
        gsap.to(astronaut, {
          y: -120,
          rotation: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: '#cosmos',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        });
      }

    } else {
      // Vanilla JS RAF Parallax Fallback
      window.addEventListener('scroll', () => {
        window.requestAnimationFrame(runVanillaParallax);
      }, { passive: true });
    }
  }

  function runVanillaParallax() {
    if (prefersReducedMotion) return;
    const scrollY = window.scrollY;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const layers = section.querySelectorAll('.p-layer');
        layers.forEach(layer => {
          const speed = parseFloat(layer.getAttribute('data-speed')) || 0.5;
          const offset = (rect.top - window.innerHeight / 2) * (speed - 0.5) * 0.5;
          layer.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });
      }
    });
  }

  // =========================================================================
  // 4. MOUSE-MOVE PARALLAX ON DESKTOP (TILT & TRANSLATE)
  // =========================================================================
  function initMouseMoveParallax() {
    if (prefersReducedMotion || window.innerWidth < 1024) return;

    window.addEventListener('mousemove', (e) => {
      // Normalize -1 to 1 from screen center
      mouseTargetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTargetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function mouseParallaxLoop() {
      // Smooth lerp
      mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.06;
      mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.06;

      const tiltX = (mouseCurrentX * 18).toFixed(2);
      const tiltY = (mouseCurrentY * 18).toFixed(2);

      // Subtle shift on aerostat
      const aerostat = document.getElementById('aerostat-ship');
      if (aerostat) {
        aerostat.style.transform = `translate3d(${tiltX * 0.8}px, ${tiltY * 0.8}px, 0) rotate(${mouseCurrentX * 3}deg)`;
      }

      // Floating Aeroliths in ridge
      const aeroL = document.querySelector('.aerolith-left');
      const aeroR = document.querySelector('.aerolith-right');
      if (aeroL) aeroL.style.transform = `translate3d(${-tiltX}px, ${-tiltY}px, 0)`;
      if (aeroR) aeroR.style.transform = `translate3d(${tiltX * 1.2}px, ${tiltY * 1.2}px, 0)`;

      // Astronaut float
      const astronaut = document.getElementById('spacewalker');
      if (astronaut) {
        astronaut.style.transform = `translate3d(${tiltX * 1.4}px, ${tiltY * 1.4}px, 0) rotate(${mouseCurrentX * 6}deg)`;
      }

      window.requestAnimationFrame(mouseParallaxLoop);
    }

    window.requestAnimationFrame(mouseParallaxLoop);
  }

  // =========================================================================
  // 5. AMBIENT CANVAS PARTICLE & METEOR SYSTEM
  // =========================================================================
  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;
  const particles = [];
  const PARTICLE_COUNT = 65;

  class AmbientParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvasWidth;
      this.y = initial ? Math.random() * canvasHeight : canvasHeight + 10;
      this.size = Math.random() * 2.5 + 0.8;
      this.speedY = Math.random() * 0.6 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.6 + 0.2;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update(scrollVelocity) {
      // Particle responds to scroll velocity
      this.y -= this.speedY + scrollVelocity * 0.03;
      this.x += this.speedX;

      if (this.y < -20 || this.x < -20 || this.x > canvasWidth + 20) {
        this.reset();
      }
    }

    draw(ctx, altitudeProgress) {
      // Color shifts with altitude
      ctx.save();
      const pulse = Math.sin(performance.now() * this.pulseSpeed * 0.005 + this.pulseOffset);
      const alpha = Math.max(0.1, this.opacity + pulse * 0.25);

      if (altitudeProgress < 0.25) {
        // Golden dawn fireflies
        ctx.fillStyle = `rgba(255, 209, 102, ${alpha})`;
        ctx.shadowColor = '#FFD166';
        ctx.shadowBlur = 8;
      } else if (altitudeProgress < 0.6) {
        // Highland & cloud golden-rose spores
        ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
        ctx.shadowColor = '#FB923C';
        ctx.shadowBlur = 6;
      } else {
        // Stratospheric & Cosmic cyan/white stardust
        ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    ambientCanvas.width = canvasWidth;
    ambientCanvas.height = canvasHeight;
  }

  function initParticles() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new AmbientParticle());
    }

    function renderParticles() {
      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(currentVelocity);
        particles[i].draw(canvasCtx, progress);
      }

      window.requestAnimationFrame(renderParticles);
    }

    window.requestAnimationFrame(renderParticles);
  }

  // =========================================================================
  // 6. SYNTHESIZED CELESTIAL AUDIO ENGINE (WEB AUDIO API)
  // =========================================================================
  let audioCtx = null;
  let isAudioPlaying = false;
  let masterGain = null;
  let synthNodes = [];

  function initAudioContext() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // Warm celestial chord (A2: 110Hz, E3: 165Hz, A3: 220Hz, C#4: 277.18Hz)
    const chordFrequencies = [110, 164.81, 220, 277.18];

    chordFrequencies.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const nodeGain = audioCtx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + idx * 150, audioCtx.currentTime);

      nodeGain.gain.setValueAtTime(0.08 / chordFrequencies.length, audioCtx.currentTime);

      // Low Frequency Oscillator for subtle breathing shimmer
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.15 + idx * 0.05, audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(6, audioCtx.currentTime);

      lfo.connect(osc.frequency);
      osc.connect(filter);
      filter.connect(nodeGain);
      nodeGain.connect(masterGain);

      osc.start();
      lfo.start();
      synthNodes.push({ osc, filter, nodeGain, lfo });
    });
  }

  function toggleAudio() {
    if (!audioCtx) initAudioContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isAudioPlaying = !isAudioPlaying;

    if (isAudioPlaying) {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 1.5);
      if (audioStatusText) audioStatusText.textContent = 'ON';
      if (audioToggleBtn) audioToggleBtn.classList.add('active');
    } else {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      if (audioStatusText) audioStatusText.textContent = 'OFF';
      if (audioToggleBtn) audioToggleBtn.classList.remove('active');
    }
  }

  function playCelestialChime(freq = 528) {
    if (!audioCtx) initAudioContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.3);
  }

  // =========================================================================
  // 7. MICRO-INTERACTIONS & USER ACTIONS
  // =========================================================================
  function initInteractions() {
    // Audio button
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', () => {
        toggleAudio();
        if (isAudioPlaying) playCelestialChime(440);
      });
    }

    // Soundscape preview button
    if (previewFlightBtn) {
      previewFlightBtn.addEventListener('click', () => {
        if (!isAudioPlaying) toggleAudio();
        playCelestialChime(660);
      });
    }

    // Begin Ascent button
    const beginBtn = document.getElementById('begin-ascent-btn');
    if (beginBtn) {
      beginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const ridge = document.getElementById('ridge');
        if (ridge) ridge.scrollIntoView({ behavior: 'smooth' });
        playCelestialChime(330);
      });
    }

    // Transmit Cosmic Signal Button
    if (transmitBtn) {
      transmitBtn.addEventListener('click', (e) => {
        playCelestialChime(880);
        triggerParticleBurst(e.clientX, e.clientY);

        if (dispatchToast) {
          dispatchToast.hidden = false;
          dispatchToast.style.display = 'block';
          setTimeout(() => {
            dispatchToast.hidden = true;
            dispatchToast.style.display = 'none';
          }, 4500);
        }

        if (terminalOutput) {
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
          terminalOutput.innerHTML += `<br>> [${timestamp}] DISPATCH TRANSMITTED: SIGNAL STRENGTH 100% (STATION SOL-9)`;
        }
      });
    }

    // Relaunch / Free-fall button
    if (relaunchBtn) {
      relaunchBtn.addEventListener('click', () => {
        playCelestialChime(220);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Side Waypoint Dots & Nav Links
    waypointDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const targetId = dot.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      });
    });

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // Particle fireworks burst on click
  function triggerParticleBurst(originX, originY) {
    const burstCount = 24;
    for (let i = 0; i < burstCount; i++) {
      const p = document.createElement('div');
      p.className = 'click-burst-spark';
      p.style.position = 'fixed';
      p.style.left = `${originX}px`;
      p.style.top = `${originY}px`;
      p.style.width = '6px';
      p.style.height = '6px';
      p.style.borderRadius = '50%';
      p.style.backgroundColor = i % 2 === 0 ? '#38BDF8' : '#FDE047';
      p.style.boxShadow = `0 0 10px ${p.style.backgroundColor}`;
      p.style.pointerEvents = 'none';
      p.style.zIndex = '99999';

      const angle = (Math.PI * 2 / burstCount) * i;
      const velocity = Math.random() * 80 + 40;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      document.body.appendChild(p);

      p.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
      ], {
        duration: 750,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }).onfinish = () => p.remove();
    }
  }

  // =========================================================================
  // 8. SCROLL LISTENER & INITIALIZATION
  // =========================================================================
  window.addEventListener('scroll', updateTelemetryAndHUD, { passive: true });

  window.addEventListener('DOMContentLoaded', () => {
    updateTelemetryAndHUD();
    initParallaxEngine();
    initMouseMoveParallax();
    initParticles();
    initInteractions();
  });

})();
