/**
 * VALMORA - Bespoke Grand Tourer
 * Interactive Sticky Scroll Hero & Cloth Peel Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const header = document.querySelector('.site-header');
  const heroContainer = document.querySelector('.hero-scroll-container');
  const heroPinnedViewport = document.querySelector('.hero-pinned-viewport');
  const layerCovered = document.querySelector('.layer-covered');
  const clothPeelSeam = document.querySelector('.cloth-peel-seam');
  const clothFoldShadow = document.querySelector('.cloth-fold-shadow');
  const heroTextBlock = document.querySelector('.hero-text-block');
  const heroRevealedText = document.querySelector('.hero-stage-revealed-text');
  const scrollProgressBadge = document.querySelector('.scroll-progress-badge');
  const scrollText = document.querySelector('.scroll-text');
  const revealSlider = document.getElementById('revealSlider');
  const btnQuickReveal = document.getElementById('btnQuickReveal');
  const cursorSpotlight = document.querySelector('.cursor-spotlight');
  const audioBtn = document.getElementById('audioToggle');
  const coveredImg = document.querySelector('.layer-covered .car-image');
  const revealedImg = document.querySelector('.layer-revealed .car-image');
  const btnPrimary = document.querySelector('.btn-primary-valmora');
  const scrollIndicator = document.querySelector('.scroll-indicator-container');

  // Animation State
  let targetProgress = 0;       // Raw progress calculated from scroll (0 to 1)
  let smoothProgress = 0;       // Smoothly interpolated progress for fluid 60fps/120fps motion
  let isManualOverride = false; // Flag when dragging slider
  let isCoveredState = true;

  // Audio Engine State
  let audioContext = null;
  let engineSoundNodes = null;
  let isAudioPlaying = false;

  // --------------------------------------------------------------------------
  // 1. Header Scroll Styling
  // --------------------------------------------------------------------------
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // --------------------------------------------------------------------------
  // 2. Mouse Tracking Spotlight & Subtle 3D Tilt
  // --------------------------------------------------------------------------
  window.addEventListener('mousemove', (e) => {
    if (cursorSpotlight) {
      cursorSpotlight.style.left = `${e.clientX}px`;
      cursorSpotlight.style.top = `${e.clientY}px`;
    }

    // Subtle parallax tilt across desktop viewport
    const xRatio = (e.clientX / window.innerWidth) - 0.5;
    const yRatio = (e.clientY / window.innerHeight) - 0.5;
    
    if (revealedImg) {
      const tiltX = xRatio * 6;
      const tiltY = yRatio * 4;
      revealedImg.style.transform = `scale(1.02) translate(${tiltX}px, ${tiltY}px)`;
    }
  });

  // --------------------------------------------------------------------------
  // 3. Realistic Cloth Peel & Visual Presentation Physics
  // --------------------------------------------------------------------------
  function renderFrame(scrollProg) {
    // Phase Partitioning:
    // [0.00 -> 0.10]: Initial hold. "A Legend Reimagined" lifts and fades.
    // [0.10 -> 0.72]: Active cloth peel. Cloth progresses from 0% to 100% removed.
    // [0.72 -> 1.00]: Fully revealed car. Hero viewport remains 100% sticky and active!
    // [> 1.00]: Natural scroll to next section commences.

    const PEEL_START = 0.10;
    const PEEL_END = 0.72;

    let clothProgress = 0;
    if (scrollProg < PEEL_START) {
      clothProgress = 0;
    } else if (scrollProg > PEEL_END) {
      clothProgress = 1;
    } else {
      clothProgress = (scrollProg - PEEL_START) / (PEEL_END - PEEL_START);
    }

    const t = Math.min(Math.max(clothProgress, 0), 1);
    const percentage = Math.round(t * 100);

    // --- Dynamic Realistic Cloth Draping & Wave Movement ---
    if (layerCovered) {
      if (t <= 0) {
        layerCovered.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
        layerCovered.style.opacity = '1';
        layerCovered.style.visibility = 'visible';
        if (coveredImg) coveredImg.style.transform = 'translateX(0px) scale(1)';
        if (clothPeelSeam) clothPeelSeam.style.opacity = '0';
        if (clothFoldShadow) clothFoldShadow.style.opacity = '0';
      } else if (t >= 0.999) {
        // Completely removed! 100% car visible
        layerCovered.style.clipPath = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
        layerCovered.style.opacity = '0';
        layerCovered.style.visibility = 'hidden';
        if (clothPeelSeam) clothPeelSeam.style.opacity = '0';
        if (clothFoldShadow) clothFoldShadow.style.opacity = '0';
      } else {
        layerCovered.style.visibility = 'visible';
        layerCovered.style.opacity = `${1 - Math.pow(t, 4) * 0.4}`; // stays opaque until final snap

        // Undulating organic cloth wave contour
        const billow = Math.sin(t * Math.PI) * 4.5;
        const base = t * 118 - 8;

        const x1 = Math.min(100, Math.max(0, base + 14 + billow));        // roof / top corner
        const x2 = Math.min(100, Math.max(0, base + 4 - billow * 0.4));   // hood crest
        const x3 = Math.min(100, Math.max(0, base + 9 + billow * 0.8));   // body crease
        const x4 = Math.min(100, Math.max(0, base - 2 - billow * 0.6));   // lower rocker
        const x5 = Math.min(100, Math.max(0, base - 10));                 // ground hem

        layerCovered.style.clipPath = `polygon(${x1}% 0%, 100% 0%, 100% 100%, ${x5}% 100%, ${x4}% 75%, ${x3}% 50%, ${x2}% 25%)`;

        // Physical cloth slide/drag back
        if (coveredImg) {
          const dragX = t * 38;
          coveredImg.style.transform = `translateX(${dragX}px) scale(${1 + t * 0.02})`;
        }

        // Seam & Shadow positioning along the dynamic fold curve
        const seamX = (x2 + x3) / 2;
        const seamIntensity = Math.sin(t * Math.PI);

        if (clothPeelSeam) {
          clothPeelSeam.style.opacity = `${Math.min(1, seamIntensity * 1.6)}`;
          clothPeelSeam.style.left = `${seamX}%`;
        }
        if (clothFoldShadow) {
          clothFoldShadow.style.opacity = `${Math.min(0.85, seamIntensity * 1.3)}`;
          clothFoldShadow.style.left = `${seamX}%`;
        }
      }
    }

    // --- Headline 1: A LEGEND REIMAGINED (Fades smoothly out) ---
    if (heroTextBlock) {
      const fade1 = Math.max(0, 1 - (scrollProg / 0.28));
      const transY1 = -(scrollProg / 0.28) * 50;
      heroTextBlock.style.opacity = fade1.toFixed(3);
      heroTextBlock.style.transform = `translateY(${transY1}px)`;
      heroTextBlock.style.pointerEvents = fade1 < 0.1 ? 'none' : 'auto';
    }

    // --- Section 2: Cinematic Lighting Beam & Lens Flare Sweep ---
    const cinematicBeam = document.getElementById('cinematicBeam');
    const studioFlare = document.getElementById('studioFlare');
    const heroCarScene = document.getElementById('heroCarScene');

    if (cinematicBeam) {
      // Beam sweeps across and illuminates the oxblood bodywork as the sheet peels
      const beamOpacity = Math.min(0.85, t * 1.25);
      const beamX = (t - 0.5) * 80;
      cinematicBeam.style.opacity = beamOpacity.toFixed(3);
      cinematicBeam.style.transform = `rotate(-25deg) translateX(${beamX.toFixed(1)}px)`;
    }

    if (studioFlare) {
      // Warm optical flare catches the chrome windshield pillars
      const flareIntensity = Math.sin(t * Math.PI);
      studioFlare.style.opacity = (flareIntensity * 0.9).toFixed(3);
      studioFlare.style.transform = `scaleX(${0.4 + t * 0.7}) rotate(-6deg) translateX(${(t * 40).toFixed(1)}px)`;
    }

    // --- Section 2: Cinematic Camera Movement (Dolly In + Perspective) ---
    if (heroCarScene) {
      const cameraDolly = 0.98 + (t * 0.05); // 0.98 to 1.03 scale
      const cameraTilt = (t * 1.1); // subtle low-angle stance
      heroCarScene.style.transform = `scale(${cameraDolly.toFixed(4)}) perspective(1200px) rotateX(${cameraTilt.toFixed(2)}deg)`;
    }

    // --- Indicator Badges & Labels ---
    if (scrollProgressBadge) {
      scrollProgressBadge.textContent = `${percentage}%`;
    }

    if (scrollText) {
      if (t >= 0.98) {
        scrollText.textContent = '100% REVEALED';
        scrollText.style.color = 'var(--accent-gold)';
      } else if (t > 0.05) {
        scrollText.textContent = 'UNVEILING...';
        scrollText.style.color = 'var(--accent-gold-light)';
      } else {
        scrollText.textContent = 'SCROLL TO UNVEIL';
        scrollText.style.color = 'var(--text-muted)';
      }
    }

    // --- Synchronize Manual Slider ---
    if (revealSlider && !isManualOverride) {
      revealSlider.value = percentage;
    }
  }

  // --------------------------------------------------------------------------
  // 4. Smooth Animation Loop (LERP Interpolation)
  // --------------------------------------------------------------------------
  function animationLoop() {
    // Smooth lerp (0.12 factor gives organic cloth physics and zero stutter)
    const diff = targetProgress - smoothProgress;
    if (Math.abs(diff) > 0.0002) {
      smoothProgress += diff * 0.12;
      renderFrame(smoothProgress);
    }

    requestAnimationFrame(animationLoop);
  }
  requestAnimationFrame(animationLoop);

  // --------------------------------------------------------------------------
  // 5. Scroll Tracking Logic
  // --------------------------------------------------------------------------
  function calculateScrollProgress() {
    if (!heroContainer || isManualOverride) return;

    const rect = heroContainer.getBoundingClientRect();
    const scrollableDistance = heroContainer.offsetHeight - window.innerHeight;

    if (scrollableDistance <= 0) return;

    // Distance scrolled inside the hero container
    const scrolledInside = -rect.top;
    const rawProgress = scrolledInside / scrollableDistance;

    // Clamp between 0 and 1
    targetProgress = Math.min(Math.max(rawProgress, 0), 1);
  }

  window.addEventListener('scroll', calculateScrollProgress, { passive: true });
  window.addEventListener('resize', calculateScrollProgress, { passive: true });
  calculateScrollProgress();

  // --------------------------------------------------------------------------
  // 6. Smooth Scroll To Position Helper
  // --------------------------------------------------------------------------
  function scrollToHeroProgress(desiredProgress) {
    if (!heroContainer) return;
    const scrollableDistance = heroContainer.offsetHeight - window.innerHeight;
    const heroTop = heroContainer.getBoundingClientRect().top + window.scrollY;
    const targetY = heroTop + (scrollableDistance * desiredProgress);

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }

  // --------------------------------------------------------------------------
  // 7. Interactive CTA & Quick Unveil Buttons
  // --------------------------------------------------------------------------
  // Primary CTA: "EXPLORE THE JOURNEY" scrolls to the full reveal hold
  if (btnPrimary) {
    btnPrimary.addEventListener('click', (e) => {
      e.preventDefault();
      // Scroll to 0.78 where the car is 100% unveiled and completely visible
      scrollToHeroProgress(0.78);
    });
  }

  // Scroll indicator click
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      scrollToHeroProgress(0.78);
    });
  }

  // Quick Unveil toggle
  if (btnQuickReveal) {
    btnQuickReveal.addEventListener('click', () => {
      if (isCoveredState) {
        scrollToHeroProgress(0.78);
        btnQuickReveal.querySelector('span').textContent = 'Cover Car';
        isCoveredState = false;
      } else {
        scrollToHeroProgress(0);
        btnQuickReveal.querySelector('span').textContent = 'Quick Unveil';
        isCoveredState = true;
      }
    });
  }

  // Manual Slider
  if (revealSlider) {
    revealSlider.addEventListener('input', (e) => {
      isManualOverride = true;
      const pct = parseFloat(e.target.value) / 100;
      // Map 0..1 slider to the peel interval [0.10, 0.72]
      const mappedProg = 0.10 + pct * (0.72 - 0.10);
      targetProgress = mappedProg;
      smoothProgress = mappedProg;
      renderFrame(mappedProg);
    });

    revealSlider.addEventListener('change', () => {
      // Synchronize window scroll position to slider position
      if (heroContainer) {
        const scrollableDistance = heroContainer.offsetHeight - window.innerHeight;
        const heroTop = heroContainer.getBoundingClientRect().top + window.scrollY;
        const targetY = heroTop + (scrollableDistance * targetProgress);
        window.scrollTo({ top: targetY, behavior: 'auto' });
      }
      setTimeout(() => {
        isManualOverride = false;
      }, 300);
    });
  }

  // --------------------------------------------------------------------------
  // 8. Luxury Web Audio Engine (Atmospheric V8 Ambient Rumble & Studio Resonance)
  // --------------------------------------------------------------------------
  function initLuxuryAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();

      // Master Gain
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.001, audioContext.currentTime);
      masterGain.connect(audioContext.destination);

      // Low frequency warm rumble oscillator (sub-bass purr)
      const rumbleOsc = audioContext.createOscillator();
      rumbleOsc.type = 'sawtooth';
      rumbleOsc.frequency.setValueAtTime(42, audioContext.currentTime);

      // Filter to make it a deep mechanical purr
      const lowpass = audioContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(95, audioContext.currentTime);

      // Secondary harmonizer
      const subOsc = audioContext.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(84, audioContext.currentTime);

      const subGain = audioContext.createGain();
      subGain.gain.setValueAtTime(0.4, audioContext.currentTime);

      rumbleOsc.connect(lowpass);
      subOsc.connect(subGain);
      subGain.connect(lowpass);
      lowpass.connect(masterGain);

      rumbleOsc.start();
      subOsc.start();

      engineSoundNodes = {
        masterGain,
        rumbleOsc,
        subOsc,
        lowpass
      };
    } catch (err) {
      console.warn('Web Audio could not be initialized:', err);
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      if (!audioContext) {
        initLuxuryAudio();
      }

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (!isAudioPlaying) {
        engineSoundNodes.masterGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 1.2);
        audioBtn.classList.add('playing');
        audioBtn.setAttribute('title', 'Mute Ambient Audio');
        isAudioPlaying = true;
      } else {
        engineSoundNodes.masterGain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.8);
        audioBtn.classList.remove('playing');
        audioBtn.setAttribute('title', 'Play Ambient Audio');
        isAudioPlaying = false;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. Mobile Navigation Toggle
  // --------------------------------------------------------------------------
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) {
        const isHidden = window.getComputedStyle(navLinks).display === 'none';
        navLinks.style.display = isHidden ? 'flex' : 'none';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(7, 8, 10, 0.95)';
        navLinks.style.padding = '1.5rem 2rem';
        navLinks.style.backdropFilter = 'blur(16px)';
        navLinks.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
      }
    });
  }

  // ==========================================================================
  // SECTION 3: 360° TURNTABLE & INTERACTIVE CLOSE-UP CAMERA CONTROLLER
  // ==========================================================================
  const turntableViewport = document.getElementById('turntableViewport');
  const turntableImageStage = document.getElementById('turntableImageStage');
  const turntableCarImg = document.getElementById('turntableCarImg');
  const turntableSlider = document.getElementById('turntableSlider');
  const turntableAngleBadge = document.getElementById('turntableAngleBadge');
  const btnAutoRotate = document.getElementById('btnAutoRotate');
  const autoRotateText = document.getElementById('autoRotateText');
  const viewPills = document.querySelectorAll('.view-pill[data-view]');
  const toggleHotspotsBtn = document.getElementById('toggleHotspotsBtn');
  const hotspotsStatusText = document.getElementById('hotspotsStatusText');
  const hotspotsLayer = document.getElementById('hotspotsLayer');
  const hotspotPins = document.querySelectorAll('.hotspot-pin');

  // Close-Up HUD & Reset Elements
  const turntableCloseupHud = document.getElementById('turntableCloseupHud');
  const closeupHudText = document.getElementById('closeupHudText');
  const stageResetBtn = document.getElementById('stageResetBtn');

  // Modal elements
  const hotspotModal = document.getElementById('hotspotModal');
  const hotspotModalBackdrop = document.getElementById('hotspotModalBackdrop');
  const hotspotModalClose = document.getElementById('hotspotModalClose');
  const modalMacroPreview = document.getElementById('modalMacroPreview');
  const modalPartImg = document.getElementById('modalPartImg');
  const modalMacroBadge = document.getElementById('modalMacroBadge');
  const modalBadgeTag = document.getElementById('modalBadgeTag');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalSpecsTable = document.getElementById('modalSpecsTable');
  const modalResetZoomBtn = document.getElementById('modalResetZoomBtn');
  const modalInspectBtn = document.getElementById('modalInspectBtn');

  // 360 Rotation State
  let currentAngle = 0;
  let isDragging = false;
  let startX = 0;
  let startAngle = 0;
  let isAutoRotating = false;
  let autoRotateAnimationId = null;
  let areHotspotsVisible = true;
  let activePresetKey = 'exterior';

  // Camera preset definitions for exterior view selectors (displaying parts closely!)
  const cameraPresets = {
    exterior: {
      scale: 1.0,
      x: 0,
      y: 0,
      angle: 0,
      label: 'Exterior 360°',
      isCloseUp: false,
      hotspotKey: null
    },
    headlights: {
      scale: 2.35,
      x: 18,
      y: -6,
      angle: 0,
      label: 'Adaptive LED Headlights',
      isCloseUp: true,
      hotspotKey: 'headlights'
    },
    engine: {
      scale: 2.15,
      x: 6,
      y: 4,
      angle: 0,
      label: '4.7L Quad-Cam V8 & Hood',
      isCloseUp: true,
      hotspotKey: 'engine'
    },
    wheels: {
      scale: 2.45,
      x: 22,
      y: -16,
      angle: 90,
      label: 'Borrani 72-Spoke Wire Wheels',
      isCloseUp: true,
      hotspotKey: 'wheels'
    },
    rear: {
      scale: 2.25,
      x: 18,
      y: -7,
      angle: 180,
      label: 'Rear Fastback & Exhausts',
      isCloseUp: true,
      hotspotKey: 'rear'
    },
    coachwork: {
      scale: 2.10,
      x: -14,
      y: 2,
      angle: 0,
      label: 'Superleggera Coachwork',
      isCloseUp: true,
      hotspotKey: 'coachwork'
    },
    side: {
      scale: 1.0,
      x: 0,
      y: 0,
      angle: 90,
      label: 'Side Profile',
      isCloseUp: false,
      hotspotKey: null
    }
  };

  // Frame mapping (Multi-angle views)
  function getFrameForAngle(deg) {
    const angle = ((deg % 360) + 360) % 360;

    if (angle >= 315 || angle < 45) {
      return {
        src: 'assets/car_revealed.jpg',
        mirrored: false,
        name: 'Front 3/4 Exterior',
        viewKey: 'front'
      };
    } else if (angle >= 45 && angle < 135) {
      return {
        src: 'assets/car_side.jpg',
        mirrored: false,
        name: 'Direct Side Profile',
        viewKey: 'side'
      };
    } else if (angle >= 135 && angle < 225) {
      return {
        src: 'assets/car_rear.jpg',
        mirrored: false,
        name: 'Rear Fastback 3/4',
        viewKey: 'rear'
      };
    } else {
      return {
        src: 'assets/car_side.jpg',
        mirrored: true,
        name: 'Side Profile (Driver)',
        viewKey: 'side'
      };
    }
  }

  // Hotspots specifications database (Panel 4 from reference design)
  const hotspotsData = {
    headlights: {
      title: 'Adaptive LED Matrix Headlights',
      desc: 'Classic twin circular headlamps infused with cutting-edge adaptive micro-LED matrix emitters within handcrafted aluminium bezels.',
      image: 'assets/part_headlight.jpg',
      badge: 'MACRO DETAIL • OPTICAL SYSTEM',
      tag: 'LIGHTING SPECIFICATION',
      specs: [
        { label: 'LED Architecture', value: 'Adaptive Bi-LED Matrix' },
        { label: 'Brightness', value: '4,800 Lumens Output' },
        { label: 'Bezel Material', value: 'Machined Billet Aluminium' },
        { label: 'Optic Glass', value: 'Fluted Borosilicate Crystal' }
      ]
    },
    engine: {
      title: '4.7L Quad-Cam Naturally Aspirated V8',
      desc: 'Hand-assembled naturally aspirated V8 with dual throttle bodies, velocity stacks, and bespoke dry-sump lubrication.',
      image: 'assets/part_engine.jpg',
      badge: 'MACRO DETAIL • POWERPLANT',
      tag: 'POWERTRAIN SPECIFICATION',
      specs: [
        { label: 'Displacement', value: '4.7L Naturally Aspirated V8' },
        { label: 'Peak Output', value: '450 HP @ 6,500 RPM' },
        { label: 'Torque Curve', value: '420 lb-ft @ 4,500 RPM' },
        { label: 'Acceleration', value: '0-60 MPH in 4.5 Seconds' }
      ]
    },
    wheels: {
      title: 'Borrani 72-Spoke Knock-Off Wheels',
      desc: 'Period-correct stainless steel wire wheels secured by traditional three-eared knock-off spinners, concealing modern vented discs.',
      image: 'assets/part_wheel.jpg',
      badge: 'MACRO DETAIL • RUNNING GEAR',
      tag: 'CHASSIS SPECIFICATION',
      specs: [
        { label: 'Wheel Rim', value: '16" Front / 16" Rear Borrani Wire' },
        { label: 'Braking Hardware', value: '4-Piston Monobloc Calipers' },
        { label: 'Lacing Pattern', value: '72 Hand-Laced Stainless Spokes' },
        { label: 'Compound', value: 'Michelin Classic Pilot Sport' }
      ]
    },
    rear: {
      title: 'Fastback Tail & Quad Tuned Exhausts',
      desc: 'Aerodynamic kamm-tail fastback contour with quad tuned stainless steel exhaust outlets and handcrafted chrome overriders.',
      image: 'assets/part_rear.jpg',
      badge: 'MACRO DETAIL • EXHAUST & AERO',
      tag: 'AERODYNAMIC SPECIFICATION',
      specs: [
        { label: 'Exhaust Layout', value: 'Quad Tuned Stainless Steel' },
        { label: 'Acoustic Tuning', value: 'Active Valved Resonator' },
        { label: 'Aerodynamics', value: 'Integrated Kamm-Tail Contour' },
        { label: 'Lamp Lenses', value: 'Hand-Poured Amber & Ruby Glass' }
      ]
    },
    coachwork: {
      title: 'Superleggera Handcrafted Aluminium Body',
      desc: 'Hand-beaten lightweight aluminium coachwork in deep multi-stage oxblood lacquer over a tubular steel spaceframe.',
      image: 'assets/part_coachwork.jpg',
      badge: 'MACRO DETAIL • COACHWORK',
      tag: 'BODY SPECIFICATION',
      specs: [
        { label: 'Body Style', value: '2-Door Fastback Grand Tourer' },
        { label: 'Paint Finish', value: '7-Layer Metallic Oxblood' },
        { label: 'Dry Weight', value: '3,200 lbs' },
        { label: 'Spaceframe', value: 'Tubular Steel Superleggera' }
      ]
    },
    interior: {
      title: 'Connolly Tan Leather & Mahogany Cockpit',
      desc: 'Bespoke hand-stitched tan leather interior with solid milled switchgear, analog gauges, and a vintage mahogany steering wheel.',
      image: 'assets/part_interior.jpg',
      badge: 'MACRO DETAIL • COCKPIT',
      tag: 'INTERIOR SPECIFICATION',
      specs: [
        { label: 'Upholstery', value: 'Connolly Full-Grain Saddle' },
        { label: 'Steering Wheel', value: '15" Polished Mahogany Nardi' },
        { label: 'Instrumentation', value: 'Smiths Mechanical Chronographs' },
        { label: 'Gearbox', value: '6-Speed Manual Gated Shifter' }
      ]
    }
  };

  // Update Turntable Display (Standard 360 Rotation)
  function updateTurntable(deg, syncSlider = true, resetCameraZoom = true) {
    currentAngle = ((Math.round(deg) % 360) + 360) % 360;
    const frame = getFrameForAngle(currentAngle);

    if (turntableCarImg) {
      if (turntableCarImg.getAttribute('src') !== frame.src) {
        turntableCarImg.src = frame.src;
      }
      turntableCarImg.style.transform = frame.mirrored ? 'scaleX(-1)' : 'scaleX(1)';
    }

    if (resetCameraZoom && activePresetKey !== 'exterior' && activePresetKey !== 'side') {
      activePresetKey = 'exterior';
      if (turntableImageStage) {
        turntableImageStage.style.transform = 'scale(1) translate(0, 0)';
      }
      if (turntableCloseupHud) {
        turntableCloseupHud.classList.remove('active');
      }
      viewPills.forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-view') === 'exterior');
      });
    }

    if (turntableAngleBadge && activePresetKey === 'exterior') {
      turntableAngleBadge.innerHTML = `Angle: <b>${currentAngle}°</b> &bull; ${frame.name}`;
    }

    if (turntableSlider && syncSlider) {
      turntableSlider.value = currentAngle;
    }

    updateHotspotsForAngle(currentAngle, frame.viewKey);
  }

  // Apply Camera Preset (Smoothly zoom and display parts closely!)
  function applyCameraPreset(presetKey, openModal = true) {
    const preset = cameraPresets[presetKey] || cameraPresets.exterior;
    activePresetKey = presetKey;
    stopAutoRotate();

    // 1. Set current angle & car image frame
    currentAngle = preset.angle;
    const frame = getFrameForAngle(currentAngle);
    if (turntableCarImg) {
      if (turntableCarImg.getAttribute('src') !== frame.src) {
        turntableCarImg.src = frame.src;
      }
      turntableCarImg.style.transform = frame.mirrored ? 'scaleX(-1)' : 'scaleX(1)';
    }

    if (turntableSlider) {
      turntableSlider.value = currentAngle;
    }

    // 2. Smoothly zoom & pan camera directly to the part
    if (turntableImageStage) {
      turntableImageStage.style.transform = `scale(${preset.scale}) translate(${preset.x}%, ${preset.y}%)`;
    }

    // 3. Update view pills active states
    viewPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-view') === presetKey);
    });

    // 4. Update On-Stage HUD and Badges
    if (preset.isCloseUp) {
      if (turntableCloseupHud) turntableCloseupHud.classList.add('active');
      if (closeupHudText) closeupHudText.textContent = `MACRO CAMERA: ${preset.label.toUpperCase()}`;
      if (turntableAngleBadge) turntableAngleBadge.innerHTML = `CLOSE-UP CAMERA &bull; <b>${preset.label}</b>`;

      if (openModal && preset.hotspotKey) {
        openHotspotModal(preset.hotspotKey);
      }
    } else {
      if (turntableCloseupHud) turntableCloseupHud.classList.remove('active');
      if (turntableAngleBadge) turntableAngleBadge.innerHTML = `Angle: <b>${currentAngle}°</b> &bull; ${frame.name}`;
      updateHotspotsForAngle(currentAngle, frame.viewKey);
    }
  }

  function resetToExterior360() {
    applyCameraPreset('exterior', false);
    closeHotspotModal();
  }

  function updateHotspotsForAngle(angle, viewKey) {
    const pinHeadlights = document.getElementById('pinHeadlights');
    const pinEngine = document.getElementById('pinEngine');
    const pinWheels = document.getElementById('pinWheels');
    const pinCoachwork = document.getElementById('pinCoachwork');
    const pinInterior = document.getElementById('pinInterior');

    if (!pinHeadlights || !pinEngine || !pinWheels || !pinCoachwork || !pinInterior) return;

    if (viewKey === 'front') {
      pinHeadlights.style.display = 'flex';
      pinHeadlights.style.top = '55%';
      pinHeadlights.style.left = '34%';

      pinEngine.style.display = 'flex';
      pinEngine.style.top = '48%';
      pinEngine.style.left = '47%';

      pinWheels.style.display = 'flex';
      pinWheels.style.top = '67%';
      pinWheels.style.left = '50%';

      pinCoachwork.style.display = 'flex';
      pinCoachwork.style.top = '40%';
      pinCoachwork.style.left = '63%';

      pinInterior.style.display = 'flex';
      pinInterior.style.top = '43%';
      pinInterior.style.left = '56%';
    } else if (viewKey === 'side') {
      pinHeadlights.style.display = 'flex';
      pinHeadlights.style.top = '56%';
      pinHeadlights.style.left = '90%';

      pinEngine.style.display = 'flex';
      pinEngine.style.top = '52%';
      pinEngine.style.left = '70%';

      pinWheels.style.display = 'flex';
      pinWheels.style.top = '66%';
      pinWheels.style.left = '28%';

      pinCoachwork.style.display = 'flex';
      pinCoachwork.style.top = '42%';
      pinCoachwork.style.left = '48%';

      pinInterior.style.display = 'flex';
      pinInterior.style.top = '45%';
      pinInterior.style.left = '46%';
    } else if (viewKey === 'rear') {
      pinHeadlights.style.display = 'none';
      pinEngine.style.display = 'none';

      pinWheels.style.display = 'flex';
      pinWheels.style.top = '68%';
      pinWheels.style.left = '52%';

      pinCoachwork.style.display = 'flex';
      pinCoachwork.style.top = '52%';
      pinCoachwork.style.left = '28%';

      pinInterior.style.display = 'flex';
      pinInterior.style.top = '42%';
      pinInterior.style.left = '44%';
    }
  }

  // --- Drag to Rotate Gestures ---
  if (turntableViewport) {
    turntableViewport.addEventListener('mousedown', (e) => {
      // If currently zoomed in close-up, smoothly reset zoom before rotation
      if (activePresetKey !== 'exterior' && activePresetKey !== 'side') {
        applyCameraPreset('exterior', false);
      }
      isDragging = true;
      startX = e.clientX;
      startAngle = currentAngle;
      turntableViewport.classList.add('is-dragging');
      stopAutoRotate();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const newAngle = startAngle - (deltaX * 0.65);
      updateTurntable(newAngle);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        turntableViewport.classList.remove('is-dragging');
      }
    });

    turntableViewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        if (activePresetKey !== 'exterior' && activePresetKey !== 'side') {
          applyCameraPreset('exterior', false);
        }
        isDragging = true;
        startX = e.touches[0].clientX;
        startAngle = currentAngle;
        stopAutoRotate();
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - startX;
      const newAngle = startAngle - (deltaX * 0.65);
      updateTurntable(newAngle);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  if (turntableSlider) {
    turntableSlider.addEventListener('input', (e) => {
      stopAutoRotate();
      updateTurntable(parseFloat(e.target.value), false);
    });
  }

  function startAutoRotate() {
    isAutoRotating = true;
    if (activePresetKey !== 'exterior') {
      applyCameraPreset('exterior', false);
    }
    if (btnAutoRotate) {
      btnAutoRotate.classList.add('spinning');
      if (autoRotateText) autoRotateText.textContent = 'Pause Spin';
    }

    function rotateStep() {
      if (!isAutoRotating) return;
      updateTurntable(currentAngle + 0.35, true, false);
      autoRotateAnimationId = requestAnimationFrame(rotateStep);
    }
    autoRotateAnimationId = requestAnimationFrame(rotateStep);
  }

  function stopAutoRotate() {
    isAutoRotating = false;
    if (autoRotateAnimationId) cancelAnimationFrame(autoRotateAnimationId);
    if (btnAutoRotate) {
      btnAutoRotate.classList.remove('spinning');
      if (autoRotateText) autoRotateText.textContent = 'Auto Spin';
    }
  }

  if (btnAutoRotate) {
    btnAutoRotate.addEventListener('click', () => {
      if (isAutoRotating) {
        stopAutoRotate();
      } else {
        startAutoRotate();
      }
    });
  }

  // Exterior View Selectors Click Event (Zooming and displaying parts closely)
  viewPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const viewKey = pill.getAttribute('data-view');
      if (viewKey) {
        applyCameraPreset(viewKey, true);
      }
    });
  });

  // On-Stage Reset Zoom Button
  if (stageResetBtn) {
    stageResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetToExterior360();
    });
  }

  // Modal Reset Zoom Button
  if (modalResetZoomBtn) {
    modalResetZoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetToExterior360();
    });
  }

  // Hotspot Pin Visibility Toggle
  if (toggleHotspotsBtn && hotspotsLayer) {
    toggleHotspotsBtn.addEventListener('click', () => {
      areHotspotsVisible = !areHotspotsVisible;
      hotspotsLayer.style.opacity = areHotspotsVisible ? '1' : '0';
      hotspotsLayer.style.pointerEvents = areHotspotsVisible ? 'auto' : 'none';
      if (hotspotsStatusText) {
        hotspotsStatusText.textContent = areHotspotsVisible ? 'ON' : 'OFF';
      }
    });
  }

  // Open Hotspot / Component Modal
  function openHotspotModal(key) {
    const data = hotspotsData[key];
    if (!data || !hotspotModal) return;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalDesc) modalDesc.textContent = data.desc;
    if (modalBadgeTag) modalBadgeTag.textContent = data.tag || 'COMPONENT SPECIFICATION';

    if (modalPartImg && data.image) {
      modalPartImg.src = data.image;
      modalPartImg.alt = data.title;
    }
    if (modalMacroBadge && data.badge) {
      modalMacroBadge.textContent = data.badge;
    }

    if (modalSpecsTable && data.specs) {
      modalSpecsTable.innerHTML = data.specs.map(s => `
        <div class="modal-spec-row">
          <span class="modal-spec-label">${s.label}</span>
          <span class="modal-spec-val">${s.value}</span>
        </div>
      `).join('');
    }

    hotspotModal.classList.add('open');
    hotspotModal.setAttribute('aria-hidden', 'false');
  }

  function closeHotspotModal() {
    if (hotspotModal) {
      hotspotModal.classList.remove('open');
      hotspotModal.setAttribute('aria-hidden', 'true');
    }
  }

  // Clicking Hotspot Pins on the vehicle
  hotspotPins.forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = pin.getAttribute('data-hotspot');
      if (key) {
        // Zoom camera in closely AND open detail card!
        applyCameraPreset(key, true);
      }
    });
  });

  if (hotspotModalClose) {
    hotspotModalClose.addEventListener('click', closeHotspotModal);
  }
  if (hotspotModalBackdrop) {
    hotspotModalBackdrop.addEventListener('click', closeHotspotModal);
  }
  if (modalInspectBtn) {
    modalInspectBtn.addEventListener('click', closeHotspotModal);
  }

  // Initial Turntable setup
  updateTurntable(0);

  console.log('VALMORA: 360 Turntable & Close-Up Camera Engine Active.');
});
