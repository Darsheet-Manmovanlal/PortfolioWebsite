// Track mouse coordinates globally to handle hover states accurately during layout changes
let currentMouseX = 0;
let currentMouseY = 0;
window.addEventListener('mousemove', (e) => {
  currentMouseX = e.clientX;
  currentMouseY = e.clientY;
}, { passive: true });

// Smooth scroll with offset for topbar anchor links
document.addEventListener('DOMContentLoaded', function () {
  // Set minimumRenderScale to 1 to ensure full resolution rendering (high res textures)
  customElements.whenDefined('model-viewer').then(() => {
    const ModelViewerElement = customElements.get('model-viewer');
    if (ModelViewerElement) {
      ModelViewerElement.minimumRenderScale = 1;
    }
  });

  const topBar = document.querySelector('.top-bar');
  const OFFSET = topBar?.offsetHeight || 80;
  document.querySelectorAll('.top-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      const target = document.getElementById(targetId) || document.querySelector(`[id="${targetId}"]`);
      if (target) {
        e.preventDefault();
        // Add 30px extra offset so it doesn't scroll down as much
        const y = target.getBoundingClientRect().top + window.pageYOffset - OFFSET - 30;
        window.scrollTo({ top: y, behavior: 'smooth' });
        history.replaceState(null, '', '#' + targetId);
      }
    });
  });

  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark-mode');
      const isNowDark = document.documentElement.classList.contains('dark-mode');
      localStorage.setItem('dark-mode', isNowDark);
    });
  }
});
/*
  script.js
  - Handles the liquid glass effect on the top links bar.
  - Adjusts blur and opacity as the user scrolls.
*/
const topBar = document.querySelector('.top-bar');

if (topBar) {
  const maxScroll = 260;
  const styles = getComputedStyle(document.documentElement);
  const minOpacity = parseFloat(styles.getPropertyValue('--top-bar-opacity-start')) || 0.55;
  const maxOpacity = parseFloat(styles.getPropertyValue('--top-bar-opacity-end')) || 0.92;
  const minBlur = parseFloat(styles.getPropertyValue('--top-bar-blur-start')) || 10;
  const maxBlur = parseFloat(styles.getPropertyValue('--top-bar-blur-end')) || 20;
  const accentColor = styles.getPropertyValue('--accent').trim();
  const topBarTextLight = [255, 255, 255];

  const parseColor = (color) => {
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
      return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
    }
    const hexMatch = color.match(/^#?([a-fA-F0-9]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    return [255, 255, 255];
  };

  const topBarTextDark = parseColor(accentColor);

  const findBackgroundColor = (element) => {
    while (element && element !== document.documentElement) {
      const computed = getComputedStyle(element);
      const bgColor = computed.backgroundColor;
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'inherit') {
        return bgColor;
      }
      element = element.parentElement;
    }
    const rootBg = getComputedStyle(document.documentElement).backgroundColor;
    if (rootBg && rootBg !== 'transparent' && rootBg !== 'rgba(0, 0, 0, 0)' && rootBg !== 'inherit') {
      return rootBg;
    }
    return 'rgb(255, 255, 255)';
  };

  const brightness = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  const mixColor = (light, dark, t) => {
    const clamp = (value) => Math.min(1, Math.max(0, value));
    return light.map((lightVal, index) => {
      const darkVal = dark[index] || 0;
      return Math.round(darkVal + (lightVal - darkVal) * clamp(t));
    });
  };

  const updateGlassEffect = () => {
    const scrollY = window.scrollY;
    const progress = Math.min(1, scrollY / maxScroll);
    const opacity = minOpacity + (maxOpacity - minOpacity) * progress;
    const blur = minBlur + (maxBlur - minBlur) * progress;

    const bgColor = findBackgroundColor(document.body);
    const bgRgb = parseColor(bgColor);
    const bgBrightness = brightness(bgRgb);
    const mixRatio = 1 - bgBrightness; // light background => blue text; dark background => light text
    const finalColor = mixColor(topBarTextLight, topBarTextDark, mixRatio);

    const isDark = document.documentElement.classList.contains('dark-mode');
    const glassBase = isDark ? '0, 0, 0' : '255, 255, 255';
    topBar.style.backgroundColor = `rgba(${glassBase}, ${opacity})`;
    topBar.style.backdropFilter = `blur(${blur}px)`;
    topBar.style.webkitBackdropFilter = `blur(${blur}px)`;
    topBar.style.setProperty('--top-bar-text', finalColor.join(', '));
    
    requestAnimationFrame(updateGlassEffect);
  };

  window.addEventListener('resize', updateGlassEffect, { passive: true });
  updateGlassEffect();

  // Re-enable transitions after the first paint has applied all JS-computed styles
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transition');
    });
  });
}

/* ---------- About Section Scroll Animations ---------- */
const aboutSection = document.getElementById('about-section');
const heroSection = document.querySelector('.hero');
const fixedDecorations = document.getElementById('fixed-decorations');
const aboutDecorations = document.getElementById('about-decorations');
const skillsSection = document.getElementById('skills');

if (aboutSection && heroSection && topBar) {
  const skillsPanel = skillsSection ? skillsSection.closest('.section-panel') : null;
  const aboutExpanded = aboutSection.querySelector('.about-expanded');

  let arrowsInitialized = false;
  let skillsInViewport = false;
  if (skillsPanel) {
    const rect = skillsPanel.getBoundingClientRect();
    skillsInViewport = rect.top < window.innerHeight * 0.85;
  }

  let cachedTopBarHeight = topBar.offsetHeight;
  let cachedHeroBottom = heroSection.offsetTop + heroSection.offsetHeight;

  window.addEventListener('resize', () => {
    cachedTopBarHeight = topBar.offsetHeight;
    cachedHeroBottom = heroSection.offsetTop + heroSection.offsetHeight;
  }, { passive: true });

  if (skillsPanel) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        skillsInViewport = entry.isIntersecting || entry.boundingClientRect.top < 0;
        handleScrollAnimations();
      });
    }, {
      rootMargin: '0px 0px -15% 0px'
    });
    observer.observe(skillsPanel);
  }

  const handleScrollAnimations = () => {
    if (!aboutSection || !heroSection || !topBar) return;

    const topBarBottom = window.scrollY + cachedTopBarHeight;
    const pastHero = topBarBottom >= cachedHeroBottom;

    // About section blob expansion (expands once and stays expanded)
    if (pastHero) {
      if (!aboutSection.classList.contains('is-expanded')) {
        aboutSection.classList.add('is-expanded');
        aboutSection.dataset.expandTime = performance.now();

        // Spin models using their current HTML camera-orbit values dynamically
        const sdModel = document.getElementById('sd-model');
        const kbModel = document.getElementById('kb-model');
        const guitarModel = document.getElementById('guitar-model');
        if (sdModel && kbModel) {
          // Parse dynamic default orbits from HTML attributes
          const getOrbitParams = (model, defaultVal) => {
            const orbitAttr = model.getAttribute('camera-orbit') || defaultVal;
            const parts = orbitAttr.trim().split(/\s+/);
            const theta = parseFloat(parts[0]) || 0;
            const phi = parts[1] || '75deg';
            const radius = parts[2] || '105%';
            return { raw: orbitAttr, theta, phi, radius };
          };

          const sdOrbit = getOrbitParams(sdModel, '0deg 75deg 105%');
          const kbOrbit = getOrbitParams(kbModel, '0deg 75deg 105%');
          const guitarOrbit = guitarModel ? getOrbitParams(guitarModel, '180deg 75deg 105%') : null;

          const spinModel = (model, orbit) => {
            if (!model || !orbit) return;
            const duration = 1500;
            const startTime = performance.now();
            function animateSpin(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeProgress = 1 - Math.pow(1 - progress, 3);
              const spinProgress = -360 + (360 * easeProgress);
              model.cameraOrbit = `${spinProgress + orbit.theta}deg ${orbit.phi} ${orbit.radius}`;
              if (progress < 1) {
                requestAnimationFrame(animateSpin);
              } else {
                model.cameraOrbit = orbit.raw;
              }
            }
            requestAnimationFrame(animateSpin);
          };

          const triggerModelSpin = (model, orbit) => {
            if (!model || !orbit) return;
            const runSpin = () => {
              setTimeout(() => {
                spinModel(model, orbit);
              }, 300);
            };
            if (model.loaded) {
              runSpin();
            } else {
              model.addEventListener('load', runSpin, { once: true });
            }
          };

          triggerModelSpin(sdModel, sdOrbit);
          triggerModelSpin(kbModel, kbOrbit);
          if (guitarModel && guitarOrbit) {
            triggerModelSpin(guitarModel, guitarOrbit);
          }
        }

        // Re-evaluate scroll logic once the CSS transition (1300ms) has finished
        setTimeout(() => {
          if (aboutExpanded) {
            console.log("UNCONSTRAINED_ABOUT_EXPANDED_SCROLL_HEIGHT:", aboutExpanded.scrollHeight, "WINDOW_WIDTH:", window.innerWidth);
          }
          handleScrollAnimations();
        }, 1300);
      }

      // Ensure arrows are started only once when in view
      if (!arrowsInitialized && fixedDecorations) {
        startDynamicArrows();
        arrowsInitialized = true;
      }
    }

    const expandTime = parseFloat(aboutSection.dataset.expandTime || 0);
    const isExpanding = expandTime > 0 && (performance.now() - expandTime < 1300);
    const hideDecorations = pastHero && skillsInViewport;
    const showBubbles = pastHero && skillsInViewport && !isExpanding;

    // Decorations visibility (hides immediately when skills section comes into view)
    if (hideDecorations) {
      if (fixedDecorations) fixedDecorations.classList.add('fade-out');
      if (aboutDecorations) aboutDecorations.classList.add('fade-out');
    } else {
      if (fixedDecorations) fixedDecorations.classList.remove('fade-out');
      if (aboutDecorations) aboutDecorations.classList.remove('fade-out');
    }

    // Bubbles visibility (waits for about section to finish expanding)
    const bubbles = document.getElementById('liquid-bubbles');
    if (bubbles) {
      if (showBubbles) {
        bubbles.classList.add('show-bubbles');
      } else {
        bubbles.classList.remove('show-bubbles');
      }
    }
  };

  window.addEventListener('scroll', handleScrollAnimations, { passive: true });
  handleScrollAnimations();
}

function startDynamicArrows() {
  const leftImg = document.getElementById('fixed-img-left');
  const rightImg = document.getElementById('fixed-img-right');
  const leftText = document.getElementById('decor-text-left');
  const rightText = document.getElementById('decor-text-right');
  const pathLeft = document.getElementById('dynamic-arrow-left');
  const headLeft = document.getElementById('dynamic-arrow-head-left');
  const pathRight = document.getElementById('dynamic-arrow-right');
  const headRight = document.getElementById('dynamic-arrow-head-right');

  if (!leftImg || !leftText || !pathLeft || !headLeft) return;

  function draw() {
    const leftImgRect = leftImg.getBoundingClientRect();
    const rightImgRect = rightImg.getBoundingClientRect();

    const aboutSection = document.getElementById('about-section');
    const heroSection = document.querySelector('.hero');

    if (aboutSection && heroSection) {
      const aboutRect = aboutSection.getBoundingClientRect();
      const heroRect = heroSection.getBoundingClientRect();

      const naturalBottom = aboutRect.bottom - 400;
      const textHeight = 80;
      const naturalTop = naturalBottom - textHeight;

      const safeHeroBottom = heroRect.bottom + 20;
      const leftSafeImgTop = leftImgRect.top - 60;
      const rightSafeImgTop = rightImgRect.top - 60;

      let leftOffsetY = 0;
      let rightOffsetY = 0;

      if (naturalBottom > leftSafeImgTop) leftOffsetY = leftSafeImgTop - naturalBottom;
      if (naturalBottom > rightSafeImgTop) rightOffsetY = rightSafeImgTop - naturalBottom;

      const maxLeftOffsetY = safeHeroBottom - naturalTop;
      if (leftOffsetY < maxLeftOffsetY) leftOffsetY = maxLeftOffsetY;

      const maxRightOffsetY = safeHeroBottom - naturalTop;
      if (rightOffsetY < maxRightOffsetY) rightOffsetY = maxRightOffsetY;

      leftText.style.transform = `translateY(${leftOffsetY < 0 ? leftOffsetY : 0}px) rotate(-4deg)`;
      rightText.style.transform = `translateY(${rightOffsetY < 0 ? rightOffsetY : 0}px) rotate(3deg)`;
    }

    const leftTextRect = leftText.getBoundingClientRect();
    const rightTextRect = rightText.getBoundingClientRect();

    if (leftImgRect.width === 0 || leftTextRect.width === 0) {
      requestAnimationFrame(draw);
      return;
    }

    // Left arrow
    const lx1 = leftImgRect.right - 10; // Start slightly inside the image to look like it comes from him
    const ly1 = leftImgRect.top + 80;
    const lx2 = leftTextRect.left + leftTextRect.width / 2;
    const ly2 = leftTextRect.bottom + 5;

    const lcx1 = lx1 + 20;
    const lcy1 = ly1 - 100;
    const lcx2 = lx2 - 20;
    const lcy2 = ly2 + 80;

    pathLeft.setAttribute('d', `M ${lx1} ${ly1} C ${lcx1} ${lcy1} ${lcx2} ${lcy2} ${lx2} ${ly2}`);
    headLeft.setAttribute('d', `M ${lx2 - 8} ${ly2 + 12} L ${lx2} ${ly2} L ${lx2 + 12} ${ly2 + 10}`);

    // Right arrow
    const rx1 = rightImgRect.left + 60;
    const ry1 = rightImgRect.top + 80;
    const rx2 = rightTextRect.left + rightTextRect.width / 2;
    const ry2 = rightTextRect.bottom + 5;

    const rcx1 = rx1 - 40;
    const rcy1 = ry1 - 120;
    const rcx2 = rx2 + 40;
    const rcy2 = ry2 + 60;

    pathRight.setAttribute('d', `M ${rx1} ${ry1} C ${rcx1} ${rcy1} ${rcx2} ${rcy2} ${rx2} ${ry2}`);
    headRight.setAttribute('d', `M ${rx2 + 12} ${ry2 + 10} L ${rx2} ${ry2} L ${rx2 - 8} ${ry2 + 12}`);

    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- Image Viewer Logic ---------- */
const imageViewer = document.getElementById('about-image-viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerBackBtn = document.getElementById('viewer-back-btn');
const aboutExpanded = document.querySelector('.about-expanded');
const imageCards = document.querySelectorAll('.about-card-image');
const musicCard = document.getElementById('about-music-card');
const musicPreviewPlay = document.getElementById('about-music-play');

const viewerMusic = document.getElementById('viewer-music');
const musicAudio = document.getElementById('about-music-audio');
const viewerMusicPlay = document.getElementById('viewer-music-play');
const viewerMusicTrack = document.getElementById('viewer-music-track');
const viewerMusicPlayhead = document.getElementById('viewer-music-playhead');
const viewerMusicCurrent = document.getElementById('viewer-music-current');
const viewerMusicDuration = document.getElementById('viewer-music-duration');
const viewerMusicPrevious = document.getElementById('viewer-music-prev');
const viewerMusicNext = document.getElementById('viewer-music-next');
const viewerMusicSongPill = document.getElementById('viewer-music-song-pill');
const musicTitleElements = document.querySelectorAll('.viewer-music-title');
const musicKickerElements = document.querySelectorAll('.viewer-music-kicker');
const musicVolumeControls = document.querySelectorAll('.viewer-music-volume');
const musicVolumeButtons = document.querySelectorAll('.viewer-music-volume-btn');
const musicVolumeSliders = document.querySelectorAll('.viewer-music-volume-slider');
const musicPreviewVolume = document.querySelector('.viewer-music-volume-preview');
const viewerMusicVolume = document.querySelector('.viewer-music-volume-expanded');

if (imageViewer && viewerImage && viewerBackBtn && aboutExpanded) {
  const TRANSITION_DURATION = 500;
  const DEFAULT_MUSIC_DURATION_SECONDS = 180;
  const DEFAULT_MIN_VISIBLE_GAP_PIXELS = 8;
  const DEFAULT_EDGE_INSET_SECONDS = 4;
  const MUSIC_CLOSE_TARGET_OFFSET_X = 0;
  const MUSIC_CLOSE_TARGET_OFFSET_Y = 0;

  let activeCard = null;
  let activeMode = null;
  let activeSourceRect = null;
  let idleSourceRect = null;
  let isAnimating = false;
  let activeSongIndex = 0;

  // Add future covers here; navigation buttons and dots render from this bank.
  const musicSongs = musicAudio ? [
    {
      src: musicAudio.getAttribute('src') || '',
      title: musicAudio.dataset.title || "Don't say that|you love me -|Jin (cover)",
      kicker: musicAudio.dataset.kicker || 'BANDLAB COVER',
      durationSeconds: musicAudio.dataset.durationSeconds || String(DEFAULT_MUSIC_DURATION_SECONDS),
      minVisibleGapPixels: musicAudio.dataset.minVisibleGapPixels || String(DEFAULT_MIN_VISIBLE_GAP_PIXELS),
      edgeInsetSeconds: musicAudio.dataset.edgeInsetSeconds || String(DEFAULT_EDGE_INSET_SECONDS),
      segments: musicAudio.dataset.segments || '[]'
    },
    {
      src: 'audio/intoTheSun.mp4',
      title: 'INTO THE SUN -|BTS|(cover)',
      kicker: 'BANDLAB COVER',
      durationSeconds: '199',
      minVisibleGapPixels: String(DEFAULT_MIN_VISIBLE_GAP_PIXELS),
      edgeInsetSeconds: String(DEFAULT_EDGE_INSET_SECONDS),
      segments: JSON.stringify([
        { start: 11, end: 74, label: 'Darsheet', color: '#f59e0b' },
        { start: 74, end: 108, label: 'No Vocals', color: 'rgba(255, 255, 255, 0.15)' },
        { start: 108, end: 199, label: 'Darsheet', color: '#f59e0b' }
      ])
    },
    {
      src: 'audio/thousandMiles.mp4',
      title: 'THOUSAND MILES -|The Kid Laroi|(cover)',
      kicker: 'BANDLAB COVER',
      durationSeconds: '166',
      minVisibleGapPixels: String(DEFAULT_MIN_VISIBLE_GAP_PIXELS),
      edgeInsetSeconds: String(DEFAULT_EDGE_INSET_SECONDS),
      segments: JSON.stringify([
        { start: 13, end: 166, label: 'Darsheet', color: '#f59e0b' }
      ])
    },
    {
      src: 'audio/maggotsForBrains.mp4',
      title: 'maggots for brains -|Olivia Rodrigo|(cover)',
      kicker: 'BANDLAB COVER',
      durationSeconds: '157',
      minVisibleGapPixels: String(DEFAULT_MIN_VISIBLE_GAP_PIXELS),
      edgeInsetSeconds: String(DEFAULT_EDGE_INSET_SECONDS),
      segments: JSON.stringify([
        { start: 12, end: 157, label: 'Darsheet', color: '#f59e0b' }
      ])
    }
  ] : [];

  function setViewerBounds(rect) {
    imageViewer.style.left = `${rect.left}px`;
    imageViewer.style.top = `${rect.top}px`;
    imageViewer.style.width = `${rect.width}px`;
    imageViewer.style.height = `${rect.height}px`;
    imageViewer.style.transform = `rotate(${rect.rot})`;
  }

  function getCardRect(card) {
    const containerRect = aboutExpanded.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    
    const computedStyle = window.getComputedStyle(card);
    const matrix = computedStyle.transform;
    let angle = 0;
    let scale = 1;
    
    if (matrix && matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        scale = Math.sqrt(a * a + b * b);
    }

    const unrotatedWidth = card.offsetWidth * scale;
    const unrotatedHeight = card.offsetHeight * scale;
    
    const centerX = rect.left + rect.width / 2 - containerRect.left;
    const centerY = rect.top + rect.height / 2 - containerRect.top;
    
    return {
      left: centerX - unrotatedWidth / 2,
      top: centerY - unrotatedHeight / 2,
      width: unrotatedWidth,
      height: unrotatedHeight,
      rot: `${angle}deg`,
      centerX: centerX,
      centerY: centerY
    };
  }

  function getIdleCardRect(card, centerX, centerY) {
    const unrotatedWidth = card.offsetWidth;
    const unrotatedHeight = card.offsetHeight;
    const rot = card.style.getPropertyValue('--rot') || '0deg';
    
    return {
      left: centerX - unrotatedWidth / 2,
      top: centerY - unrotatedHeight / 2,
      width: unrotatedWidth,
      height: unrotatedHeight,
      rot: rot
    };
  }

  function getExpandedRect(sourceRect, naturalWidth, naturalHeight) {
    const containerRect = aboutExpanded.getBoundingClientRect();
    
    // The container has 6rem (96px) of padding on all sides to hide the overflow boundary.
    const paddingX = 192; // 96px * 2
    const paddingY = 192; // 96px * 2
    
    const maxWidth = Math.max(sourceRect.width, containerRect.width - paddingX - 40);
    const maxHeight = Math.max(sourceRect.height, containerRect.height - paddingY - 40);
    
    let targetWidth = naturalWidth || sourceRect.width;
    let targetHeight = naturalHeight || sourceRect.height;
    
    if (targetWidth > maxWidth) {
      targetHeight = targetHeight * (maxWidth / targetWidth);
      targetWidth = maxWidth;
    }
    if (targetHeight > maxHeight) {
      targetWidth = targetWidth * (maxHeight / targetHeight);
      targetHeight = maxHeight;
    }
    
    return {
      left: (containerRect.width - targetWidth) / 2,
      top: (containerRect.height - targetHeight) / 2,
      width: targetWidth,
      height: targetHeight,
      rot: '0deg'
    };
  }

  function getMusicExpandedRect() {
    const containerRect = aboutExpanded.getBoundingClientRect();
    const paddingX = 192;
    const paddingY = 192;
    const maxWidth = Math.max(260, containerRect.width - paddingX - 40);
    const maxHeight = Math.max(420, containerRect.height - paddingY - 40);
    const targetRatio = 9 / 14;

    let targetHeight = Math.min(maxHeight, 620);
    let targetWidth = targetHeight * targetRatio;

    if (targetWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = targetWidth / targetRatio;
    }

    return {
      left: (containerRect.width - targetWidth) / 2,
      top: (containerRect.height - targetHeight) / 2,
      width: targetWidth,
      height: targetHeight,
      rot: '0deg'
    };
  }

  function setViewerMode(mode) {
    activeMode = mode;
    imageViewer.classList.toggle('is-music-mode', mode === 'music');
    viewerMusic?.setAttribute('aria-hidden', mode === 'music' ? 'false' : 'true');
  }

  function animateViewerOpen(card, targetRect) {
    isAnimating = true;
    activeCard = card;
    let sourceRect = getCardRect(card);
    activeSourceRect = {
      left: sourceRect.left,
      top: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
      rot: sourceRect.rot
    };
    idleSourceRect = getIdleCardRect(card, sourceRect.centerX, sourceRect.centerY);

    imageViewer.style.transition = 'none';
    imageViewer.style.visibility = 'visible';
    setViewerBounds(activeSourceRect);

    void imageViewer.offsetWidth;

    imageViewer.style.transition = [
      `left ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `top ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `width ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `height ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `transform ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `box-shadow ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
    ].join(', ');
    setViewerBounds(targetRect);
    imageViewer.classList.add('is-active');
    imageViewer.classList.add('img-visible');
    card.classList.add('is-active');
    aboutExpanded.classList.add('viewer-active');

    setTimeout(() => {
      isAnimating = false;
    }, TRANSITION_DURATION);
  }

  function getExpandedVolumeRect(targetRect) {
    if (!aboutExpanded) return null;

    const containerRect = aboutExpanded.getBoundingClientRect();
    const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    const top = 0.75 * rootFontSize;
    const right = 0.75 * rootFontSize;
    const height = 2.2 * rootFontSize;
    const buttonSize = 2 * rootFontSize;
    const sliderWidth = 5.75 * rootFontSize;
    const gap = 0.44 * rootFontSize;
    const paddingLeft = 0.25 * rootFontSize;
    const paddingRight = 0.75 * rootFontSize;
    const thumbSize = 0.78 * rootFontSize;
    const width = buttonSize + sliderWidth + gap + paddingLeft + paddingRight + 2; // +2 for left/right 1px borders
    const left = containerRect.left + targetRect.left + targetRect.width - right - width;

    return {
      left: Math.round(left),
      top: Math.round(containerRect.top + targetRect.top + top) + 1,
      width: Math.round(width),
      height: Math.round(height),
      buttonSize,
      sliderWidth,
      thumbSize,
      paddingLeft,
      paddingRight,
      gap,
      rot: '0deg'
    };
  }

  function createVolumeFlightClone() {
    if (!viewerMusicVolume) return null;

    const clone = viewerMusicVolume.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    clone.classList.add('viewer-music-volume-flight');
    clone.classList.remove('viewer-music-volume-expanded');
    clone.querySelectorAll('button, input').forEach((element) => {
      element.setAttribute('tabindex', '-1');
    });
    return clone;
  }

  function animateVolumeControlBetween(startRect, endRect, options = {}) {
    if (!musicPreviewVolume || !viewerMusicVolume || !startRect || !endRect) return;

    const clone = createVolumeFlightClone();
    if (!clone) return;

    const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;

    const from = {
      left: startRect.left,
      top: startRect.top,
      width: startRect.width,
      height: startRect.height,
      buttonSize: startRect.buttonSize || (2 * rootFontSize),
      sliderWidth: startRect.sliderWidth || (5.75 * rootFontSize),
      thumbSize: startRect.thumbSize || (0.78 * rootFontSize),
      paddingLeft: startRect.paddingLeft || 0,
      paddingRight: startRect.paddingRight || 0,
      gap: startRect.gap || (0.44 * rootFontSize),
      rot: startRect.rot || '0deg'
    };
    const to = {
      left: endRect.left,
      top: endRect.top,
      width: endRect.width,
      height: endRect.height,
      buttonSize: endRect.buttonSize || (2 * rootFontSize),
      sliderWidth: endRect.sliderWidth || (5.75 * rootFontSize),
      thumbSize: endRect.thumbSize || (0.78 * rootFontSize),
      paddingLeft: endRect.paddingLeft || 0,
      paddingRight: endRect.paddingRight || 0,
      gap: endRect.gap || (0.44 * rootFontSize),
      rot: endRect.rot || '0deg'
    };

    clone.style.left = `${from.left + window.scrollX}px`;
    clone.style.top = `${from.top + window.scrollY}px`;
    clone.style.width = `${from.width}px`;
    clone.style.height = `${from.height}px`;
    clone.style.setProperty('--btn-size', `${from.buttonSize}px`);
    clone.style.setProperty('--slider-width', `${from.sliderWidth}px`);
    clone.style.setProperty('--thumb-size', `${from.thumbSize}px`);
    const toPadding = options.toCompact ? '0px' : `0px ${to.paddingRight}px 0px ${to.paddingLeft}px`;
    clone.style.padding = options.fromCompact ? '0px' : `0px ${from.paddingRight}px 0px ${from.paddingLeft}px`;
    clone.style.setProperty('--flight-gap', `${from.gap}px`);
    clone.style.transform = `rotate(${from.rot})`;

    if (options.fromCompact) {
      clone.classList.add('is-compact-flight');
    } else {
      clone.classList.remove('is-compact-flight');
    }

    document.body.appendChild(clone);
    syncMusicVolumeControls();

    musicPreviewVolume.classList.add('is-flight-hidden');
    viewerMusicVolume.classList.add('is-flight-hidden');
    void clone.offsetWidth;

    requestAnimationFrame(() => {
      clone.style.left = `${to.left + window.scrollX}px`;
      clone.style.top = `${to.top + window.scrollY}px`;
      clone.style.width = `${to.width}px`;
      clone.style.height = `${to.height}px`;
      clone.style.setProperty('--btn-size', `${to.buttonSize}px`);
      clone.style.setProperty('--slider-width', `${to.sliderWidth}px`);
      clone.style.setProperty('--thumb-size', `${to.thumbSize}px`);
      clone.style.padding = toPadding;
      clone.style.setProperty('--flight-gap', `${to.gap}px`);
      clone.style.transform = `rotate(${to.rot})`;

      if (options.toCompact) {
        clone.classList.add('is-compact-flight');
      } else {
        clone.classList.remove('is-compact-flight');
      }
    });

    setTimeout(() => {
      clone.remove();

      const prevPreviewTransition = musicPreviewVolume.style.transition;
      const prevExpandedTransition = viewerMusicVolume.style.transition;

      musicPreviewVolume.style.transition = 'none';
      viewerMusicVolume.style.transition = 'none';

      musicPreviewVolume.classList.remove('is-flight-hidden');
      viewerMusicVolume.classList.remove('is-flight-hidden');

      void musicPreviewVolume.offsetWidth;
      void viewerMusicVolume.offsetWidth;

      musicPreviewVolume.style.transition = prevPreviewTransition;
      viewerMusicVolume.style.transition = prevExpandedTransition;
    }, TRANSITION_DURATION + 80);
  }

  function animateVolumeControlOpen(startRect, targetRect) {
    const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    let augmentedStartRect = null;
    if (startRect) {
      const cx = startRect.left + startRect.width / 2;
      const cy = startRect.top + startRect.height / 2;
      augmentedStartRect = {
        left: cx - rootFontSize,
        top: cy - rootFontSize,
        width: 2 * rootFontSize,
        height: 2 * rootFontSize,
        buttonSize: 2 * rootFontSize,
        sliderWidth: 0,
        rot: startRect.rot || '0deg'
      };
    }
    const endRect = getExpandedVolumeRect(targetRect);
    animateVolumeControlBetween(augmentedStartRect, endRect, { fromCompact: true, toCompact: false });
  }

  function getActiveSong() {
    return musicSongs[activeSongIndex] || musicSongs[0] || null;
  }

  function syncMusicSongLabels() {
    const song = getActiveSong();
    if (!song) return;

    musicTitleElements.forEach((title) => {
      const lines = song.title
        .split('|')
        .map((line) => line.trim())
        .filter(Boolean);
      title.replaceChildren();
      lines.forEach((line, index) => {
        if (index > 0) {
          title.appendChild(document.createElement('br'));
        }
        title.appendChild(document.createTextNode(line));
      });

      // Dynamically scale font size so that longer titles fit perfectly and don't wrap/push other elements
      const isExpanded = title.closest('#viewer-music');
      const referenceLength = 14;
      const longestLineLength = Math.max(...lines.map(line => line.length));
      const scaleFactor = referenceLength / Math.max(referenceLength, longestLineLength);

      if (isExpanded) {
        const baseFontSize = 9.5; // base cqmin from CSS
        title.style.fontSize = `${baseFontSize * scaleFactor}cqmin`;
      } else {
        const baseFontSize = 0.95; // base rem from CSS
        title.style.fontSize = `${baseFontSize * scaleFactor}rem`;
      }
    });

    musicKickerElements.forEach((kicker) => {
      kicker.textContent = song.kicker;
    });
  }

  function syncMusicNavigationState() {
    if (!viewerMusicPrevious || !viewerMusicNext) return;

    viewerMusicPrevious.disabled = (activeSongIndex === 0);
    viewerMusicNext.disabled = (activeSongIndex === musicSongs.length - 1);

    viewerMusicPrevious.setAttribute('aria-label', musicSongs.length <= 1 ? 'Restart previous song' : 'Previous song');
    viewerMusicNext.setAttribute('aria-label', musicSongs.length <= 1 ? 'Restart next song' : 'Next song');
  }

  function renderMusicSongDots() {
    if (!viewerMusicSongPill) return;

    let indicator = viewerMusicSongPill.querySelector('.viewer-music-song-active-indicator');
    
    if (!indicator || viewerMusicSongPill.querySelectorAll('.viewer-music-song-dot').length !== musicSongs.length) {
      viewerMusicSongPill.innerHTML = '';
      
      indicator = document.createElement('div');
      indicator.className = 'viewer-music-song-active-indicator';
      viewerMusicSongPill.appendChild(indicator);

      musicSongs.forEach((song, index) => {
        const dot = document.createElement('button');
        dot.className = 'viewer-music-song-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Play ${song.title.replace(/\|/g, ' ')}`);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          selectMusicSong(index);
        });
        viewerMusicSongPill.appendChild(dot);
      });
    }

    let lastActiveIndex = parseInt(viewerMusicSongPill.dataset.lastActive || 0);

    const dots = viewerMusicSongPill.querySelectorAll('.viewer-music-song-dot');
    dots.forEach((dot, index) => {
      const isActive = index === activeSongIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      
      if (isActive && indicator) {
        if (lastActiveIndex !== activeSongIndex) {
          const startDot = dots[lastActiveIndex] || dots[0];
          const endDot = dot;
          
          const pillRect = viewerMusicSongPill.getBoundingClientRect();
          const borderLeft = parseFloat(getComputedStyle(viewerMusicSongPill).borderLeftWidth) || 0;
          
          const startRect = startDot.getBoundingClientRect();
          const startLeft = startRect.left - pillRect.left - borderLeft;
          const startWidth = startRect.width;
          
          const endRect = endDot.getBoundingClientRect();
          const endLeft = endRect.left - pillRect.left - borderLeft;
          const endWidth = endRect.width;
          
          const minLeft = Math.min(startLeft, endLeft);
          const maxRight = Math.max(startLeft + startWidth, endLeft + endWidth);
          const stretchWidth = maxRight - minLeft;
          
          indicator.style.setProperty('--start-left', `${startLeft}px`);
          indicator.style.setProperty('--start-width', `${startWidth}px`);
          
          indicator.style.setProperty('--min-left', `${minLeft}px`);
          indicator.style.setProperty('--stretch-width', `${stretchWidth}px`);
          
          indicator.style.setProperty('--end-left', `${endLeft}px`);
          indicator.style.setProperty('--end-width', `${endWidth}px`);
          
          indicator.classList.remove('is-stretching');
          void indicator.offsetWidth; // Force reflow
          indicator.classList.add('is-stretching');
        } else {
          const pillRect = viewerMusicSongPill.getBoundingClientRect();
          const borderLeft = parseFloat(getComputedStyle(viewerMusicSongPill).borderLeftWidth) || 0;
          const dotRect = dot.getBoundingClientRect();
          
          indicator.style.setProperty('--end-left', `${dotRect.left - pillRect.left - borderLeft}px`);
          indicator.style.setProperty('--end-width', `${dotRect.width}px`);
          indicator.classList.remove('is-stretching');
        }
      }
    });
    
    viewerMusicSongPill.dataset.lastActive = activeSongIndex;
  }

  function applyMusicSong(song, shouldResume) {
    if (!musicAudio || !song) return;

    musicAudio.src = song.src;
    musicAudio.dataset.durationSeconds = song.durationSeconds;
    musicAudio.dataset.minVisibleGapPixels = song.minVisibleGapPixels;
    musicAudio.dataset.edgeInsetSeconds = song.edgeInsetSeconds;
    musicAudio.dataset.segments = song.segments;
    musicAudio.currentTime = 0;

    syncMusicSongLabels();
    renderMusicSegments();
    renderMusicSongDots();
    updateMusicProgress();
    syncMusicNavigationState();

    if (shouldResume) {
      musicAudio.play().catch(() => {
        syncMusicPlayButtons(false);
      });
    } else {
      syncMusicPlayButtons(false);
    }
  }

  function selectMusicSong(index) {
    if (!musicAudio || musicSongs.length === 0) return;

    const normalizedIndex = ((index % musicSongs.length) + musicSongs.length) % musicSongs.length;
    const wasPlaying = !musicAudio.paused;
    activeSongIndex = normalizedIndex;
    applyMusicSong(getActiveSong(), wasPlaying);
  }

  function changeMusicSong(direction) {
    if (musicSongs.length === 0) return;
    const targetIndex = activeSongIndex + direction;
    if (targetIndex >= 0 && targetIndex < musicSongs.length) {
      selectMusicSong(targetIndex);
    } else if (direction === 1) {
      // If it ends on the last track, stop playback and reset
      pauseMusic();
      musicAudio.currentTime = 0;
      updateMusicProgress();
    }
  }

  function formatMusicTime(seconds) {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = Math.floor(safeSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }

  function getMusicProgressDuration() {
    const configuredDuration = Number(musicAudio?.dataset.durationSeconds);
    if (Number.isFinite(configuredDuration) && configuredDuration > 0) {
      return configuredDuration;
    }

    if (Number.isFinite(musicAudio?.duration) && musicAudio.duration > 0) {
      return musicAudio.duration;
    }

    return DEFAULT_MUSIC_DURATION_SECONDS;
  }

  function getMusicMinVisibleGapPixels() {
    const configuredGap = Number(musicAudio?.dataset.minVisibleGapPixels);
    return Number.isFinite(configuredGap) && configuredGap >= 0
      ? configuredGap
      : DEFAULT_MIN_VISIBLE_GAP_PIXELS;
  }

  function getMusicEdgeInsetSeconds(duration) {
    const configuredInset = Number(musicAudio?.dataset.edgeInsetSeconds);
    const edgeInset = Number.isFinite(configuredInset) && configuredInset >= 0
      ? configuredInset
      : DEFAULT_EDGE_INSET_SECONDS;

    return Math.min(edgeInset, duration / 2);
  }

  function getMusicSegments() {
    if (!musicAudio?.dataset.segments) return [];

    try {
      return JSON.parse(musicAudio.dataset.segments)
        .map((segment) => ({
          start: Number(segment.start),
          end: Number(segment.end),
          label: String(segment.label || ''),
          color: String(segment.color || '#60a5fa')
        }))
        .filter((segment) => {
          return Number.isFinite(segment.start)
            && Number.isFinite(segment.end)
            && segment.end > segment.start;
        })
        .sort((a, b) => a.start - b.start);
    } catch {
      return [];
    }
  }

  function getMusicTimelineLayout(duration) {
    const trackWidth = viewerMusicTrack?.getBoundingClientRect().width || 0;
    const playheadWidth = viewerMusicPlayhead?.getBoundingClientRect().width || 0;
    const musicSegments = getMusicSegments();
    const edgeInsetSeconds = getMusicEdgeInsetSeconds(duration);

    if (trackWidth <= 0) {
      const edgeInsetPercent = (edgeInsetSeconds / duration) * 100;
      const timelineWidthPercent = Math.max(0, 100 - (edgeInsetPercent * 2));

      return musicSegments.map((segment) => ({
        ...segment,
        isGap: false,
        left: edgeInsetPercent + ((segment.start / duration) * timelineWidthPercent),
        width: ((segment.end - segment.start) / duration) * timelineWidthPercent,
        unit: '%'
      }));
    }

    const edgeInsetPixels = ((edgeInsetSeconds / duration) * trackWidth) + (playheadWidth / 2);
    const timelineWidth = Math.max(0, trackWidth - (edgeInsetPixels * 2));
    let cursorTime = 0;
    let fixedGapWidth = 0;
    let coloredDuration = 0;
    const minVisibleGapPixels = getMusicMinVisibleGapPixels();

    musicSegments.forEach((segment) => {
      const gapDuration = Math.max(0, segment.start - cursorTime);
      if (gapDuration > 0) {
        fixedGapWidth += Math.max((gapDuration / duration) * timelineWidth, minVisibleGapPixels);
      }
      coloredDuration += Math.max(0, segment.end - segment.start);
      cursorTime = Math.max(cursorTime, segment.end);
    });

    const trailingGapDuration = Math.max(0, duration - cursorTime);
    if (trailingGapDuration > 0) {
      fixedGapWidth += Math.max((trailingGapDuration / duration) * timelineWidth, minVisibleGapPixels);
    }

    const coloredWidth = Math.max(0, timelineWidth - fixedGapWidth);
    const layout = [];
    let cursor = edgeInsetPixels;
    cursorTime = 0;

    musicSegments.forEach((segment) => {
      const gapDuration = Math.max(0, segment.start - cursorTime);
      if (gapDuration > 0) {
        const gapWidth = Math.max((gapDuration / duration) * timelineWidth, minVisibleGapPixels);
        layout.push({
          start: cursorTime,
          end: segment.start,
          isGap: true,
          left: cursor,
          width: gapWidth,
          unit: 'px'
        });
        cursor += gapWidth;
      }

      const width = coloredDuration > 0
        ? ((segment.end - segment.start) / coloredDuration) * coloredWidth
        : 0;
      layout.push({
        ...segment,
        isGap: false,
        left: cursor,
        width,
        unit: 'px'
      });

      cursor += width;
      cursorTime = Math.max(cursorTime, segment.end);
    });

    const finalGapDuration = Math.max(0, duration - cursorTime);
    if (finalGapDuration > 0) {
      layout.push({
        start: cursorTime,
        end: duration,
        isGap: true,
        left: cursor,
        width: Math.max((finalGapDuration / duration) * timelineWidth, minVisibleGapPixels),
        unit: 'px'
      });
    }

    return layout;
  }

  function getMusicVisualProgress(time, duration) {
    const trackWidth = viewerMusicTrack?.getBoundingClientRect().width || 0;
    const playheadWidth = viewerMusicPlayhead?.getBoundingClientRect().width || 0;
    const timelineLayout = getMusicTimelineLayout(duration);
    const safeTime = Math.min(duration, Math.max(0, time));

    if (timelineLayout.length === 0) {
      const edgeInsetSeconds = getMusicEdgeInsetSeconds(duration);
      const edgeInsetPixels = ((edgeInsetSeconds / duration) * trackWidth) + (playheadWidth / 2);
      const timelineWidth = Math.max(0, trackWidth - (edgeInsetPixels * 2));
      return trackWidth > 0
        ? ((edgeInsetPixels + ((safeTime / duration) * timelineWidth)) / trackWidth) * 100
        : (safeTime / duration) * 100;
    }

    const item = timelineLayout.find((layoutItem) => safeTime >= layoutItem.start && safeTime <= layoutItem.end);

    if (!item) {
      return safeTime >= duration ? 100 : 0;
    }

    const itemDuration = Math.max(1, item.end - item.start);
    const itemProgress = (safeTime - item.start) / itemDuration;

    if (item.unit === '%') {
      return item.left + (item.width * itemProgress);
    }

    return trackWidth > 0
      ? ((item.left + (item.width * itemProgress)) / trackWidth) * 100
      : (safeTime / duration) * 100;
  }

  function getMusicTimeFromVisualPosition(positionX, duration) {
    const trackWidth = viewerMusicTrack?.getBoundingClientRect().width || 0;
    const playheadWidth = viewerMusicPlayhead?.getBoundingClientRect().width || 0;
    const timelineLayout = getMusicTimelineLayout(duration);
    const edgeInsetSeconds = getMusicEdgeInsetSeconds(duration);
    const edgeInsetPixels = ((edgeInsetSeconds / duration) * trackWidth) + (playheadWidth / 2);
    const timelineWidth = Math.max(0, trackWidth - (edgeInsetPixels * 2));
    const safePosition = Math.min(edgeInsetPixels + timelineWidth, Math.max(edgeInsetPixels, positionX));
    const item = timelineLayout.find((layoutItem) => {
      return layoutItem.unit === 'px'
        && safePosition >= layoutItem.left
        && safePosition <= layoutItem.left + layoutItem.width;
    });

    if (!item || trackWidth <= 0) {
      return ((safePosition - edgeInsetPixels) / Math.max(1, timelineWidth)) * duration;
    }

    const itemProgress = (safePosition - item.left) / Math.max(1, item.width);
    return item.start + ((item.end - item.start) * itemProgress);
  }

  function syncMusicPlayButtons(isPlaying) {
    [musicPreviewPlay, viewerMusicPlay].forEach((button) => {
      if (!button) return;

      button.classList.toggle('is-playing', isPlaying);
      button.setAttribute('aria-label', isPlaying ? 'Pause cover' : 'Play cover');
    });
  }

  function syncMusicVolumeControls() {
    if (!musicAudio) return;

    const volumeLevel = `${Math.round(musicAudio.volume * 100)}%`;
    const isMuted = musicAudio.muted || musicAudio.volume === 0;

    const vol = musicAudio.muted ? 0 : musicAudio.volume;

    musicVolumeControls.forEach((control) => {
      control.classList.toggle('is-muted', isMuted);
      control.classList.toggle('vol-low', vol > 0 && vol <= 0.33);
      control.classList.toggle('vol-med', vol > 0.33 && vol <= 0.66);
      control.classList.toggle('vol-high', vol > 0.66);
      control.style.setProperty('--volume-level', volumeLevel);
    });

    musicVolumeButtons.forEach((button) => {
      button.setAttribute('aria-label', isMuted ? 'Unmute cover' : 'Mute cover');
    });

    musicVolumeSliders.forEach((slider) => {
      slider.value = musicAudio.volume.toString();
      slider.style.setProperty('--volume-level', volumeLevel);
    });
  }

  function toggleMusicMute() {
    if (!musicAudio) return;

    if (musicAudio.volume === 0) {
      musicAudio.volume = 1;
      musicAudio.muted = false;
    } else {
      musicAudio.muted = !musicAudio.muted;
    }

    syncMusicVolumeControls();
  }

  function updateMusicProgress() {
    if (!musicAudio) return;

    const duration = getMusicProgressDuration();
    const progress = getMusicVisualProgress(musicAudio.currentTime, duration);

    if (viewerMusicPlayhead) {
      viewerMusicPlayhead.style.left = `${progress}%`;
    }

    if (viewerMusicCurrent) {
      viewerMusicCurrent.textContent = formatMusicTime(musicAudio.currentTime);
    }
    if (viewerMusicDuration) {
      viewerMusicDuration.textContent = formatMusicTime(duration);
    }
  }

  function renderMusicSegments() {
    if (!viewerMusicTrack) return;

    viewerMusicTrack.querySelectorAll('.viewer-music-segment').forEach((segment) => segment.remove());

    const duration = getMusicProgressDuration();
    const segmentLayout = getMusicTimelineLayout(duration).filter((item) => !item.isGap);
    segmentLayout.forEach((segment, index) => {
      const progressSegment = document.createElement('div');
      progressSegment.className = 'viewer-music-segment';
      progressSegment.classList.toggle('is-first', index === 0);
      progressSegment.classList.toggle('is-last', index === segmentLayout.length - 1);
      progressSegment.classList.toggle('is-start', segment.start <= 0);
      progressSegment.classList.toggle('is-end', segment.end >= duration);
      progressSegment.dataset.label = segment.label;
      progressSegment.setAttribute('aria-label', segment.label);
      progressSegment.style.left = `${segment.left}${segment.unit}`;
      progressSegment.style.width = `${segment.width}${segment.unit}`;
      progressSegment.style.setProperty('--segment-color', segment.color);
      viewerMusicTrack.insertBefore(progressSegment, viewerMusicPlayhead);
    });
  }

  let audioCtx;
  let audioSource;
  let compressor;
  let masterGain;

  function initAudioContext() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    audioCtx = new AudioContext();
    audioSource = audioCtx.createMediaElementSource(musicAudio);
    
    // Create a compressor for universal normalization
    // Aggressive settings to act like a limiter
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -40; // Catch almost all signals
    compressor.knee.value = 40;       // Very smooth transition
    compressor.ratio.value = 20;      // Hard limit
    compressor.attack.value = 0.005;  // Fast attack
    compressor.release.value = 0.25;  // Moderate release
    
    // Create a master gain node to reduce the max volume significantly
    masterGain = audioCtx.createGain();
    
    audioSource.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(audioCtx.destination);
    
    updateWebAudioVolume();
  }

  function updateWebAudioVolume() {
    if (masterGain && musicAudio && audioCtx) {
      const targetVolume = musicAudio.muted ? 0 : musicAudio.volume;
      // Significantly reduce max volume (max 40% of original)
      masterGain.gain.setTargetAtTime(targetVolume * 0.4, audioCtx.currentTime, 0.05);
    }
  }

  function pauseMusic() {
    if (!musicAudio) return;
    musicAudio.pause();
    syncMusicPlayButtons(false);
  }

  function toggleMusicPlayback() {
    if (!musicAudio) return;

    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (musicAudio.paused) {
      musicAudio.play().catch(() => {
        syncMusicPlayButtons(false);
      });
    } else {
      pauseMusic();
    }
  }

  imageCards.forEach((img) => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isAnimating) return;

      const card = img.closest('.about-card');
      if (!card) return;

      if (!img.complete) return; // Basic safety check
      setViewerMode('image');
      viewerImage.src = img.src;
      viewerImage.alt = img.alt || 'Expanded View';

      const sourceRect = getCardRect(card);
      const targetRect = getExpandedRect(sourceRect, img.naturalWidth, img.naturalHeight);
      animateViewerOpen(card, targetRect);
    });
  });

  if (musicCard && viewerMusic && musicAudio) {
    const openMusicViewer = (e) => {
      e.stopPropagation();
      if (isAnimating) return;

      initAudioContext();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Temporarily set active state to capture correct unrotated start rect
      const prevTransition = musicCard.style.transition;
      musicCard.style.transition = 'none';
      musicCard.classList.add('is-active');
      aboutExpanded.classList.add('viewer-active');
      void musicCard.offsetWidth;

      const rawStartRect = musicPreviewVolume?.getBoundingClientRect();
      const currentCardRect = getCardRect(musicCard);
      const volumeStartRect = rawStartRect ? {
        left: Math.round(rawStartRect.left),
        top: Math.round(rawStartRect.top),
        width: Math.round(rawStartRect.width),
        height: Math.round(rawStartRect.height),
        rot: currentCardRect.rot
      } : null;

      musicCard.classList.remove('is-active');
      aboutExpanded.classList.remove('viewer-active');
      void musicCard.offsetWidth;
      musicCard.style.transition = prevTransition;

      const targetRect = getMusicExpandedRect();
      setViewerMode('music');
      viewerImage.src = '';
      animateVolumeControlOpen(volumeStartRect, targetRect);
      animateViewerOpen(musicCard, targetRect);
      requestAnimationFrame(() => {
        renderMusicSegments();
        renderMusicSongDots();
        syncMusicNavigationState();
        updateMusicProgress();
        syncMusicPlayButtons(!musicAudio.paused);
      });
    };

    musicCard.addEventListener('click', openMusicViewer);
    musicCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMusicViewer(e);
      }
    });
  }

  if (musicPreviewPlay && musicAudio) {
    musicPreviewPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusicPlayback();
    });
  }

  if (musicAudio && viewerMusicPlay) {
    viewerMusicPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusicPlayback();
    });

    viewerMusicPrevious?.addEventListener('click', (e) => {
      e.stopPropagation();
      changeMusicSong(-1);
    });

    viewerMusicNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      changeMusicSong(1);
    });

    musicAudio.addEventListener('loadedmetadata', () => {
      renderMusicSegments();
      updateMusicProgress();
      syncMusicVolumeControls();
      syncMusicNavigationState();
    });

    musicAudio.addEventListener('timeupdate', updateMusicProgress);

    musicAudio.addEventListener('play', () => {
      syncMusicPlayButtons(true);
    });

    musicAudio.addEventListener('pause', () => {
      syncMusicPlayButtons(false);
    });

    musicAudio.addEventListener('ended', () => {
      if (musicSongs.length > 1) {
        changeMusicSong(1);
      } else {
        pauseMusic();
        musicAudio.currentTime = 0;
        updateMusicProgress();
      }
    });

    musicAudio.addEventListener('volumechange', () => {
      syncMusicVolumeControls();
      updateWebAudioVolume();
    });
  }

  if (musicAudio && musicVolumeButtons.length > 0) {
    musicVolumeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMusicMute();
      });
    });
  }

  if (musicAudio && musicVolumeSliders.length > 0) {
    musicVolumeSliders.forEach((slider) => {
      slider.addEventListener('input', (e) => {
        e.stopPropagation();
        musicAudio.volume = Number(slider.value);
        musicAudio.muted = musicAudio.volume === 0;
        syncMusicVolumeControls();
      });

      slider.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  }

  syncMusicVolumeControls();
  syncMusicSongLabels();
  syncMusicNavigationState();
  renderMusicSongDots();

  if (viewerMusicTrack && musicAudio) {
    let isMusicScrubbing = false;
    let wasPlayingBeforeScrub = false;

    const seekMusicFromPointer = (e) => {
      const rect = viewerMusicTrack.getBoundingClientRect();
      const duration = getMusicProgressDuration();
      musicAudio.currentTime = getMusicTimeFromVisualPosition(e.clientX - rect.left, duration);
      updateMusicProgress();
    };

    viewerMusicTrack.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      isMusicScrubbing = true;
      wasPlayingBeforeScrub = !musicAudio.paused;
      
      if (wasPlayingBeforeScrub) {
        musicAudio.pause();
      }

      viewerMusicTrack.setPointerCapture(e.pointerId);
      seekMusicFromPointer(e);
      e.preventDefault();
    });

    viewerMusicTrack.addEventListener('pointermove', (e) => {
      if (!isMusicScrubbing) return;

      seekMusicFromPointer(e);
      e.preventDefault();
    });

    const stopMusicScrubbing = (e) => {
      if (!isMusicScrubbing) return;

      isMusicScrubbing = false;
      if (viewerMusicTrack.hasPointerCapture(e.pointerId)) {
        viewerMusicTrack.releasePointerCapture(e.pointerId);
      }
      
      if (wasPlayingBeforeScrub) {
        musicAudio.play().catch(() => {
          syncMusicPlayButtons(false);
        });
      }
    };

    viewerMusicTrack.addEventListener('pointerup', stopMusicScrubbing);
    viewerMusicTrack.addEventListener('pointercancel', stopMusicScrubbing);
    viewerMusicTrack.addEventListener('lostpointercapture', () => {
      if (isMusicScrubbing && wasPlayingBeforeScrub) {
        musicAudio.play().catch(() => {
          syncMusicPlayButtons(false);
        });
      }
      isMusicScrubbing = false;
    });
  }

  viewerBackBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isAnimating) return;
    isAnimating = true;
    const wasMusicMode = activeMode === 'music';

    let volumeStartRect = null;
    let volumeEndRect = null;

    if (wasMusicMode && musicCard && musicPreviewVolume && viewerMusicVolume) {
      volumeStartRect = viewerMusicVolume.getBoundingClientRect();
      const targetRect = getMusicExpandedRect();
      const expandedVolumeRect = getExpandedVolumeRect(targetRect);
      if (expandedVolumeRect) {
        volumeStartRect = expandedVolumeRect; // use logical calculated rect instead of DOM rect for accuracy
      }

      const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;

      // Temporarily set idle state to capture correct end rect
      const prevTransition = musicCard.style.transition;
      musicCard.style.transition = 'none';
      musicCard.classList.remove('is-active');
      aboutExpanded.classList.remove('viewer-active');

      const rawEndRect = musicPreviewVolume.getBoundingClientRect();
      const cx = rawEndRect.left + rawEndRect.width / 2;
      const cy = rawEndRect.top + rawEndRect.height / 2;
      volumeEndRect = {
        left: Math.round(cx - rootFontSize),
        top: Math.round(cy - rootFontSize),
        width: 2 * rootFontSize,
        height: 2 * rootFontSize,
        buttonSize: 2 * rootFontSize,
        sliderWidth: 0,
        rot: idleSourceRect.rot || '0deg'
      };

      musicCard.classList.add('is-active');
      aboutExpanded.classList.add('viewer-active');
      void musicCard.offsetWidth;
      musicCard.style.transition = prevTransition;
    }

    if (wasMusicMode) {
      imageViewer.classList.add('is-music-closing');
    }
    aboutExpanded.classList.add('viewer-returning');

    imageViewer.classList.remove('is-active');
    imageViewer.classList.remove('img-visible');
    aboutExpanded.classList.remove('viewer-active');

    if (activeCard) {
      activeCard.classList.remove('is-active');
    }

    if (activeCard) {
      let closeTargetRect = idleSourceRect;
      if (closeTargetRect) {
        closeTargetRect = {
          left: closeTargetRect.left,
          top: closeTargetRect.top,
          width: closeTargetRect.width,
          height: closeTargetRect.height,
          rot: closeTargetRect.rot
        };
        if (wasMusicMode) {
          closeTargetRect.left += MUSIC_CLOSE_TARGET_OFFSET_X;
          closeTargetRect.top += MUSIC_CLOSE_TARGET_OFFSET_Y;
        }
        imageViewer.style.boxShadow = '0 0 0 rgba(0, 0, 0, 0)';
        setViewerBounds(closeTargetRect);
      }
    }

    if (wasMusicMode && musicCard) {
      animateVolumeControlBetween(volumeStartRect, volumeEndRect, { fromCompact: false, toCompact: true });
    }

    setTimeout(() => {
      imageViewer.style.transition = 'none';
      imageViewer.style.left = '0px';
      imageViewer.style.top = '0px';
      imageViewer.style.width = '0px';
      imageViewer.style.height = '0px';
      imageViewer.style.visibility = 'hidden';
      imageViewer.style.transform = '';
      imageViewer.style.opacity = '';
      viewerImage.src = '';
      imageViewer.classList.remove('is-music-closing');
      aboutExpanded.classList.remove('viewer-returning');
      // activeCard.classList.remove('is-active') is already handled at the start
      setViewerMode(null);
      void imageViewer.offsetWidth;
      imageViewer.style.transition = '';
      activeCard = null;
      activeMode = null;
      activeSourceRect = null;
      idleSourceRect = null;
      isAnimating = false;
    }, TRANSITION_DURATION + 80);
  });

  // Close when clicking outside the expanded viewer
  document.addEventListener('click', (e) => {
    if (imageViewer.classList.contains('is-active') && !isAnimating) {
      if (!imageViewer.contains(e.target)) {
        viewerBackBtn.click();
      }
    }
  });
}

/* ---------- Search Bar Functionality ---------- */
const searchBarInput = document.querySelector('.search-bar');
if (searchBarInput) {
  const searchableElements = document.querySelectorAll('.section-block, .about-section p, .skills-badges li, .timeline-content h4, .timeline-content p, .education-list li, .project-card h3, .project-card li, .job-hunt-text');
  
  // Store original HTML to restore when query changes
  const originalHTMLs = new Map();
  searchableElements.forEach((el, index) => {
    originalHTMLs.set(index, el.innerHTML);
  });

  searchBarInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    searchableElements.forEach((el, index) => {
      const orig = originalHTMLs.get(index);
      el.innerHTML = orig;
      
      if (query !== '') {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})(?![^<]*>)`, 'gi');
        el.innerHTML = orig.replace(regex, '<span class="search-highlight">$1</span>');
      }
    });
  });

  searchBarInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstMatch = document.querySelector('.search-highlight');
      if (firstMatch) {
        const topBar = document.querySelector('.top-bar');
        const baseOffset = topBar?.offsetHeight || 80;
        const OFFSET = baseOffset + 5; // Extra padding so it doesn't touch the topbar
        const y = firstMatch.getBoundingClientRect().top + window.pageYOffset - OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  });
}

/* ---------- Custom Scrollbar Functionality ---------- */
const scrollContainer = document.querySelector('.custom-scrollbar-container');
const scrollThumb = document.querySelector('.custom-scrollbar-thumb');

if (scrollContainer && scrollThumb) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const positionScrollContainer = () => {
    const heroSection = document.querySelector('.hero');
    const rightImage = document.getElementById('fixed-img-right');
    const defaultHeight = 250;
    const gap = 24;

    const heroBottom = heroSection ? heroSection.getBoundingClientRect().bottom : 0;
    const rightImageRect = rightImage ? rightImage.getBoundingClientRect() : null;
    const rightImageVisible = rightImageRect && rightImageRect.width > 0 && rightImageRect.height > 0 && rightImageRect.top < window.innerHeight;
    const lowerLimit = rightImageVisible ? rightImageRect.top : window.innerHeight;
    const safeTop = Math.max(gap, heroBottom + gap);
    const safeBottom = Math.min(window.innerHeight - gap, lowerLimit - gap);
    const availableHeight = safeBottom - safeTop;

    if (availableHeight < 30) {
      scrollContainer.style.opacity = '0';
      return 0;
    }

    const containerHeight = Math.min(defaultHeight, availableHeight);
    const containerCenter = safeTop + (availableHeight / 2);

    scrollContainer.style.top = `${containerCenter}px`;
    scrollContainer.style.height = `${containerHeight}px`;

    return containerHeight;
  };

  // Dragging logic
  let isDragging = false;
  let grabOffsetY = 0;
  let dragTrackTop = 0;
  let dragTrackHeight = 0;

  const updateThumb = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
      scrollContainer.style.opacity = '0';
      return;
    }
    if (isDragging) return;

    const containerHeight = positionScrollContainer();
    if (containerHeight <= 0) return;

    scrollContainer.style.opacity = '1';
    // Thumb height proportional to viewport
    let thumbHeight = Math.max(30, (window.innerHeight / document.documentElement.scrollHeight) * containerHeight);
    scrollThumb.style.height = `${thumbHeight}px`;

    const scrollRatio = window.scrollY / scrollHeight;
    const maxTop = containerHeight - thumbHeight;
    scrollThumb.style.top = `${scrollRatio * maxTop}px`;
  };

  window.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  // Initial calculation after layout is fully ready
  window.addEventListener('load', updateThumb);

  scrollThumb.addEventListener('pointerdown', (e) => {
    isDragging = true;
    const containerRect = scrollContainer.getBoundingClientRect();
    grabOffsetY = e.clientY - scrollThumb.getBoundingClientRect().top;
    dragTrackTop = containerRect.top;
    dragTrackHeight = containerRect.height;
    scrollThumb.setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  scrollThumb.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const containerHeight = dragTrackHeight;
    const thumbHeight = scrollThumb.clientHeight;
    const maxTop = containerHeight - thumbHeight;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (maxTop <= 0 || scrollHeight <= 0) return;

    const thumbTop = clamp(e.clientY - dragTrackTop - grabOffsetY, 0, maxTop);
    scrollThumb.style.top = `${thumbTop}px`;
    window.scrollTo(0, (thumbTop / maxTop) * scrollHeight);
    e.preventDefault();
  });

  const stopDragging = (e) => {
    if (isDragging) {
      isDragging = false;
      if (e?.pointerId !== undefined && scrollThumb.hasPointerCapture(e.pointerId)) {
        scrollThumb.releasePointerCapture(e.pointerId);
      }
      document.body.style.userSelect = '';
      updateThumb();
    }
  };

  scrollThumb.addEventListener('pointerup', stopDragging);
  scrollThumb.addEventListener('pointercancel', stopDragging);
}

/* ---------- Project Card Expansion ---------- */
const javaGameCard = document.getElementById('java-game-card');

if (javaGameCard) {
  const PROJECT_CARD_TRANSITION_DURATION = 500;
  const projectSpriteStage = javaGameCard.querySelector('.project-sprite-stage');
  const projectSpriteRunner = javaGameCard.querySelector('.project-sprite-runner');
  const projectSprite = javaGameCard.querySelector('.project-sprite');
  const projectSpriteActions = {
    walking: {
      frames: ['char1.png', 'char2.png', 'char3.png', 'char4.png', 'char5.png'],
      frameMs: 160,
      speed: 0.06
    },
    running: {
      frames: ['running1.png', 'running2.png', 'running3.png', 'running4.png'],
      frameMs: 160,
      speed: 0.14
    },
    punching: {
      frames: ['punching1.png', 'punching2.png', 'punching3.png', 'punching4.png', 'punching5.png', 'punching6.png', 'punching7.png'],
      frameMs: 80,
      duration: 560
    },
    kicking: {
      frames: ['kick1.png'],
      frameMs: 375,
      duration: 375
    }
  };
  const projectSpriteBasePath = 'assets/labgame/';
  let projectSpriteActionTimer = null;
  let projectSpriteFrameTimer = null;
  let trackingRAF = null;
  let lastTrackingTime = 0;
  let projectSpriteFrameIndex = 0;
  let projectSpriteX = 0;
  let projectSpriteBgX = 0;
  let projectSpriteFacing = 1;
  let projectSpriteRoutine = [];
  let projectSpriteComboIndex = 0;
  let projectSpriteState = 'TRACKING';
  let cachedSpriteWidth = 0;
  let combatAnchorMouseX = 0;
  let patrolDirection = 1;
  let patrolDecisionAccumulator = 0;

  function stopProjectSprite() {
    clearTimeout(projectSpriteActionTimer);
    clearInterval(projectSpriteFrameTimer);
    if (trackingRAF) cancelAnimationFrame(trackingRAF);
    projectSpriteActionTimer = null;
    projectSpriteFrameTimer = null;
    trackingRAF = null;
    projectSpriteFrameIndex = 0;
    projectSpriteRoutine = [];
    projectSpriteState = 'TRACKING';
    patrolDirection = 1;
    patrolDecisionAccumulator = 0;
    projectSpriteBgX = 0;
    if (projectSpriteStage) {
      projectSpriteStage.style.setProperty('--bg-x', '0px');
    }
    if (projectSprite) {
      projectSprite.dataset.action = '';
      projectSprite.src = `${projectSpriteBasePath}char1.png`;
    }
    if (projectSpriteRunner) {
      projectSpriteRunner.classList.remove('is-tracking');
      projectSpriteRunner.style.setProperty('--sprite-move-duration', '520ms');
      projectSpriteRunner.style.setProperty('--sprite-y', '0px');
    }
  }

  function getProjectSpriteMaxX() {
    if (!projectSprite || !projectSpriteStage) return;
    const stageWidth = projectSpriteStage.clientWidth;
    if (!cachedSpriteWidth) {
      cachedSpriteWidth = projectSpriteRunner?.getBoundingClientRect().width || projectSprite.getBoundingClientRect().width || 92;
    }
    return Math.max(0, stageWidth - cachedSpriteWidth - 8);
  }

  function setProjectSpriteFrames(actionName) {
    const action = projectSpriteActions[actionName];
    if (!action) return;

    if (projectSprite.dataset.action === actionName) return;

    clearInterval(projectSpriteFrameTimer);
    projectSpriteFrameIndex = 0;
    projectSprite.dataset.action = actionName;
    projectSprite.src = `${projectSpriteBasePath}${action.frames[0]}`;

    projectSpriteFrameTimer = setInterval(() => {
      projectSpriteFrameIndex = (projectSpriteFrameIndex + 1) % action.frames.length;
      projectSprite.src = `${projectSpriteBasePath}${action.frames[projectSpriteFrameIndex]}`;
    }, action.frameMs);
  }

  function faceProjectSprite(direction) {
    if (!projectSprite) return;
    projectSpriteFacing = direction < 0 ? -1 : 1;
    projectSprite.style.setProperty('--sprite-facing', String(projectSpriteFacing));
  }

  function turnProjectSprite() {
    faceProjectSprite(projectSpriteFacing * -1);
  }

  function spawnBird(direction) {
    if (!projectSpriteStage) return;
    const bird = document.createElement('div');
    bird.className = 'environment-bird';
    
    // Random height in the upper 40% of the stage
    const startY = 10 + Math.random() * 30;
    bird.style.top = `${startY}%`;
    
    // Start slightly off-screen in the direction opposite to flight
    bird.style.left = direction > 0 ? '-20px' : '100%';
    bird.style.transform = direction < 0 ? 'scaleX(-1)' : 'none';
    
    // Add the two frames for flapping animation
    bird.innerHTML = `
      <svg class="bird-frame-1" viewBox="0 0 24 24"><path d="M2 12 Q8 6 12 12 Q16 6 22 12 Q16 10 12 14 Q8 10 2 12 Z"/></svg>
      <svg class="bird-frame-2" viewBox="0 0 24 24"><path d="M2 12 Q8 18 12 12 Q16 18 22 12 Q16 14 12 10 Q8 14 2 12 Z"/></svg>
    `;
    
    projectSpriteStage.appendChild(bird);
    
    const duration = 4000 + Math.random() * 4000;
    
    const animation = bird.animate([
      { left: direction > 0 ? '-20px' : '100%' },
      { left: direction > 0 ? '100%' : '-20px' }
    ], {
      duration: duration,
      easing: 'linear'
    });
    
    animation.onfinish = () => bird.remove();
  }

  function projectSpriteTrackingLoop(currentTime) {
    if (!javaGameCard.classList.contains('is-expanded')) return;
    
    const deltaTime = Math.min(currentTime - lastTrackingTime, 100);
    lastTrackingTime = currentTime;

    if (typeof window.combatCooldown === 'undefined') window.combatCooldown = 0;
    if (window.combatCooldown > 0) window.combatCooldown -= deltaTime;

    const maxX = getProjectSpriteMaxX() || 0;
    if (maxX <= 0) {
      trackingRAF = requestAnimationFrame(projectSpriteTrackingLoop);
      return;
    }

    const stageRect = projectSpriteStage.getBoundingClientRect();
    const isMouseInStage = currentMouseX >= stageRect.left && currentMouseX <= stageRect.right &&
                           currentMouseY >= stageRect.top && currentMouseY <= stageRect.bottom;

    if (!isMouseInStage) {
      if (projectSpriteState === 'COMBAT') {
        clearTimeout(projectSpriteActionTimer);
        projectSpriteRoutine = [];
        window.combatCooldown = 0;
      }
      projectSpriteState = 'PATROL';

      const isExploring = (projectSpriteX <= 0 || projectSpriteX >= maxX);
      const speed = isExploring ? projectSpriteActions.running.speed : projectSpriteActions.walking.speed;
      const moveAmount = speed * deltaTime;
      projectSpriteX += patrolDirection * moveAmount;
      projectSpriteBgX -= patrolDirection * moveAmount * 0.5;

      const bgAspect = 8846 / 771;
      const renderedBgWidth = stageRect.height * bgAspect;
      const minBgX = Math.min(0, stageRect.width - renderedBgWidth);
      const maxBgX = 0;

      let hitMapEdge = false;
      if (projectSpriteBgX <= minBgX) {
        projectSpriteBgX = minBgX;
        hitMapEdge = true;
      } else if (projectSpriteBgX >= maxBgX) {
        projectSpriteBgX = maxBgX;
        hitMapEdge = true;
      }

      if (projectSpriteX <= 0) {
        projectSpriteX = 0;
        if (hitMapEdge) patrolDirection = 1;
        else if (Math.random() < 0.015) spawnBird(patrolDirection);
      } else if (projectSpriteX >= Math.max(0, maxX)) {
        projectSpriteX = maxX;
        if (hitMapEdge) patrolDirection = -1;
        else if (Math.random() < 0.015) spawnBird(patrolDirection);
      }

      patrolDecisionAccumulator += deltaTime;
      if (patrolDecisionAccumulator >= 1000) {
        patrolDecisionAccumulator = 0;
        if (Math.random() < 0.015 && !hitMapEdge) {
          patrolDirection *= -1;
        }
      }

      faceProjectSprite(patrolDirection);
      setProjectSpriteFrames(isExploring ? 'running' : 'walking');
      projectSpriteRunner.classList.add('is-tracking');
      projectSpriteRunner.style.setProperty('--sprite-x', `${projectSpriteX}px`);
      projectSpriteStage.style.setProperty('--bg-x', `${projectSpriteBgX}px`);

      trackingRAF = requestAnimationFrame(projectSpriteTrackingLoop);
      return;
    } else {
      if (projectSpriteState === 'PATROL') {
        projectSpriteState = 'TRACKING';
      }
    }

    const mouseStageX = currentMouseX - stageRect.left;
    const spriteCenterX = projectSpriteX + 46;
    const distanceToMouse = mouseStageX - spriteCenterX;
    const absDistanceToMouse = Math.abs(distanceToMouse);

    if (projectSpriteState === 'COMBAT') {
      if (Math.abs(mouseStageX - combatAnchorMouseX) > 15) { 
        clearTimeout(projectSpriteActionTimer);
        projectSpriteRoutine = [];
        projectSpriteState = 'TRACKING';
        window.combatCooldown = 600;
      } else {
        trackingRAF = requestAnimationFrame(projectSpriteTrackingLoop);
        return;
      }
    }

    if (absDistanceToMouse <= 30 && window.combatCooldown <= 0) {
      projectSpriteState = 'COMBAT';
      projectSpriteRunner.classList.remove('is-tracking');
      combatAnchorMouseX = mouseStageX;
      faceProjectSprite(distanceToMouse >= 0 ? 1 : -1);
      if (projectSpriteComboIndex === 0) {
        projectSpriteComboIndex = 1;
        
        projectSpriteRoutine = [
          { type: 'combat', action: 'punching' },
          { type: 'combat', action: 'punching' },
          { type: 'combat', action: 'punching' },
          { type: 'combat', action: 'kicking' }
        ];
      } else {
        projectSpriteComboIndex = 0;
        projectSpriteRoutine = [
          { type: 'combat', action: 'kicking' },
          { type: 'combat', action: 'kicking' },
          { type: 'combat', action: 'punching' },
          { type: 'combat', action: 'punching' },
          { type: 'combat', action: 'punching' },
          { type: 'combat', action: 'punching' },
          { type: 'combat', action: 'kicking' }
        ];
      }
      runNextProjectSpriteStep();
      trackingRAF = requestAnimationFrame(projectSpriteTrackingLoop);
      return;
    }

    let isRunning = projectSprite.dataset.action === 'running';
    if (absDistanceToMouse > 120) isRunning = true;
    if (absDistanceToMouse < 60) isRunning = false;
    
    const speed = isRunning ? projectSpriteActions.running.speed : projectSpriteActions.walking.speed;
    const moveAmount = speed * deltaTime;

    if (absDistanceToMouse > 25) {
      const direction = distanceToMouse > 0 ? 1 : -1;
      const step = Math.min(moveAmount, absDistanceToMouse);
      const oldX = projectSpriteX;
      projectSpriteX += direction * step;
      projectSpriteX = Math.max(0, Math.min(maxX, projectSpriteX));
      
      const actualStep = Math.abs(projectSpriteX - oldX);
      if (actualStep > 0) {
        projectSpriteBgX -= direction * actualStep * 0.5;
        
        const bgAspect = 8846 / 771;
        const renderedBgWidth = stageRect.height * bgAspect;
        const minBgX = Math.min(0, stageRect.width - renderedBgWidth);
        
        projectSpriteBgX = Math.max(minBgX, Math.min(0, projectSpriteBgX));
      }

      faceProjectSprite(direction);
      
      setProjectSpriteFrames(isRunning ? 'running' : 'walking');
      projectSpriteRunner.classList.add('is-tracking');
      projectSpriteRunner.style.setProperty('--sprite-x', `${projectSpriteX}px`);
      projectSpriteStage.style.setProperty('--bg-x', `${projectSpriteBgX}px`);
    } else {
      if (projectSprite.dataset.action !== '') {
        clearInterval(projectSpriteFrameTimer);
        projectSprite.dataset.action = '';
        projectSprite.src = `${projectSpriteBasePath}char1.png`;
      }
    }

    trackingRAF = requestAnimationFrame(projectSpriteTrackingLoop);
  }

  function runNextProjectSpriteStep() {
    if (!projectSprite || !projectSpriteRunner || !projectSpriteStage || !javaGameCard.classList.contains('is-expanded')) return;

    const step = projectSpriteRoutine.shift();
    if (!step) {
      projectSpriteState = 'TRACKING';
      return;
    }

    if (step.type === 'turn') {
      turnProjectSprite();
      projectSpriteActionTimer = setTimeout(runNextProjectSpriteStep, 240);
      return;
    }

    const action = projectSpriteActions[step.action];
    if (!action) {
      projectSpriteActionTimer = setTimeout(runNextProjectSpriteStep, 0);
      return;
    }

    setProjectSpriteFrames(step.action);

    let duration = action.duration || 420;

    if (step.type === 'moveTo') {
      const nextX = Math.min(getProjectSpriteMaxX() || 0, Math.max(0, step.x));
      if (Math.abs(nextX - projectSpriteX) > 2) {
        faceProjectSprite(nextX > projectSpriteX ? 1 : -1);
      }
      const distance = Math.abs(nextX - projectSpriteX);
      
      duration = Math.max(420, Math.min(1300, distance / action.speed));

      projectSpriteRunner.style.setProperty('--sprite-move-duration', `${Math.round(duration)}ms`);
      projectSpriteRunner.style.setProperty('--sprite-y', '0px');
      projectSpriteRunner.style.setProperty('--sprite-x', `${Math.round(nextX)}px`);
      projectSpriteX = nextX;
    } else {
      projectSpriteRunner.style.setProperty('--sprite-move-duration', `${Math.round(duration)}ms`);
      projectSpriteRunner.style.setProperty('--sprite-y', '0px');
    }

    projectSpriteActionTimer = setTimeout(() => {
      runNextProjectSpriteStep();
    }, duration + (step.type === 'combat' ? 100 : 140));
  }

  function startProjectSprite() {
    if (!projectSprite || !projectSpriteRunner || !projectSpriteStage) return;

    stopProjectSprite();
    projectSpriteRoutine = [];
    projectSpriteState = 'TRACKING';
    projectSpriteX = Math.round((getProjectSpriteMaxX() || 0) * 0.06);
    faceProjectSprite(1);
    patrolDirection = 1;
    patrolDecisionAccumulator = 0;
    projectSpriteRunner.classList.add('is-tracking');
    projectSpriteRunner.style.setProperty('--sprite-x', `${Math.round(projectSpriteX)}px`);
    projectSpriteRunner.style.setProperty('--sprite-y', '0px');
    lastTrackingTime = performance.now();
    trackingRAF = requestAnimationFrame(projectSpriteTrackingLoop);
  }

  function setProjectFlightBounds(card, rect) {
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    if (rect.rot && rect.rot !== '0deg') {
      card.style.transform = `rotate(${rect.rot})`;
    } else {
      card.style.transform = '';
    }
  }

  function createProjectFlightCard(expanded) {
    const clone = javaGameCard.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    clone.querySelectorAll('a, button, input').forEach((element) => {
      element.setAttribute('tabindex', '-1');
    });
    clone.classList.add('project-card-flight');
    clone.style.position = 'absolute';
    clone.style.zIndex = '10000';
    clone.style.margin = '0';
    clone.style.pointerEvents = 'none';
    clone.classList.toggle('is-expanded', expanded);
    clone.classList.remove('is-project-hidden', 'is-project-animating');
    if (javaGameCard.matches(':hover')) {
      clone.classList.add('is-hover-locked');
    }
    clone.addEventListener('mouseleave', () => {
      clone.classList.remove('is-hover-locked');
    });
    return clone;
  }

  function setJavaGameExpanded(expand) {
    if (javaGameCard.classList.contains('is-expanded') === expand || javaGameCard.classList.contains('is-project-animating')) {
      return;
    }

    stopProjectSprite();
    if (javaGameCard._removeHoverLock) {
      javaGameCard._removeHoverLock();
    }
    javaGameCard.classList.add('is-project-animating');

    // Measure bounding box in base/unhovered state to avoid layout calculation offsets
    javaGameCard.classList.add('no-transform-instant');
    const sourceRectRaw = javaGameCard.getBoundingClientRect();
    javaGameCard.classList.remove('no-transform-instant');

    const sourceRect = {
      left: sourceRectRaw.left + window.scrollX,
      top: sourceRectRaw.top + window.scrollY,
      width: sourceRectRaw.width,
      height: sourceRectRaw.height,
      rot: '0deg'
    };

    const flightCard = createProjectFlightCard(!expand);
    document.body.appendChild(flightCard);
    flightCard.style.transition = 'none';
    setProjectFlightBounds(flightCard, sourceRect);

    javaGameCard.classList.add('is-project-hidden');
    javaGameCard.classList.toggle('is-expanded', expand);

    const targetRectRaw = javaGameCard.getBoundingClientRect();
    const targetRect = {
      left: targetRectRaw.left + window.scrollX,
      top: targetRectRaw.top + window.scrollY,
      width: targetRectRaw.width,
      height: targetRectRaw.height,
      rot: '0deg'
    };

    javaGameCard.style.height = `${sourceRect.height}px`;
    void javaGameCard.offsetWidth;
    javaGameCard.style.transition = `height ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    javaGameCard.style.height = `${targetRect.height}px`;

    void flightCard.offsetWidth;

    flightCard.classList.toggle('is-expanded', expand);
    flightCard.style.transition = [
      `left ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `top ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `width ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `height ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `transform ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `box-shadow ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      `opacity ${PROJECT_CARD_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
    ].join(', ');
    setProjectFlightBounds(flightCard, targetRect);

    window.setTimeout(() => {
      // While the card is still hidden (visibility:hidden) and transitions
      // are still disabled (is-project-animating), check if the mouse is
      // over the card and apply hover-lock so the very first visible frame
      // already has the hovered appearance.
      const rect = javaGameCard.getBoundingClientRect();
      const isMouseInside = (
        currentMouseX >= rect.left &&
        currentMouseX <= rect.right &&
        currentMouseY >= rect.top &&
        currentMouseY <= rect.bottom
      );

      // Disable transitions temporarily to prevent any hover-state transition flicker
      javaGameCard.classList.add('no-transition-instant');

      if (isMouseInside) {
        if (javaGameCard._removeHoverLock) {
          javaGameCard._removeHoverLock();
        }
        javaGameCard.classList.add('is-hover-locked');
        const removeLock = () => {
          javaGameCard.classList.remove('is-hover-locked');
          javaGameCard.removeEventListener('mouseleave', removeLock);
          javaGameCard._removeHoverLock = null;
        };
        javaGameCard._removeHoverLock = removeLock;
        javaGameCard.addEventListener('mouseleave', removeLock);
      } else {
        if (javaGameCard._removeHoverLock) {
          javaGameCard._removeHoverLock();
        }
        javaGameCard.classList.remove('is-hover-locked');
      }

      // Make the original card visible and finalize its styles while
      // it is still behind the flight card (z-index 10000), so the
      // user can't see any intermediate state.
      javaGameCard.classList.remove('is-project-hidden');
      void javaGameCard.offsetWidth;
      javaGameCard.classList.remove('is-project-animating');
      javaGameCard.style.transition = '';
      javaGameCard.style.height = '';

      // Force styles to apply without transitions
      void javaGameCard.offsetWidth;

      // NOW remove the flight card — the original card is already
      // fully visible and styled underneath, so there's no flash.
      flightCard.remove();

      if (expand) {
        startProjectSprite();
      }

      // Re-enable transitions in the next frame
      requestAnimationFrame(() => {
        javaGameCard.classList.remove('no-transition-instant');
      });
    }, PROJECT_CARD_TRANSITION_DURATION + 40);
  }

  javaGameCard.addEventListener('click', (e) => {
    // Prevent collapsing if clicking inside the media placeholders or github link
    if (e.target.closest('a') || e.target.closest('.media-placeholders')) {
      return;
    }

    setJavaGameExpanded(!javaGameCard.classList.contains('is-expanded'));
  });

  // Make the card expandable via keyboard (Enter or Space)
  javaGameCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      javaGameCard.click();
    }
  });

  window.addEventListener('resize', () => {
    if (!javaGameCard.classList.contains('is-expanded') || !projectSprite || !projectSpriteRunner || !projectSpriteStage) return;

    const maxX = getProjectSpriteMaxX() || 0;
    projectSpriteX = Math.min(projectSpriteX, maxX);
    projectSpriteRunner.style.setProperty('--sprite-x', `${Math.round(projectSpriteX)}px`);
  }, { passive: true });
}

/* ---------- About Me Blob Pagination ---------- */
const blobPrevBtn = document.querySelector('.circular-glass-btn-left');
const blobNextBtn = document.querySelector('.circular-glass-btn-right');
const blobDots = document.querySelectorAll('.about-blob-song-pill .viewer-music-song-dot');
const blobImageCards = Array.from(document.querySelectorAll('.about-expanded .about-card:not(.about-card-music) .about-card-image'));
const blobActiveIndicator = document.querySelector('.about-blob-song-pill .viewer-music-song-active-indicator');

const blobPages = [
  ['images/image1.jpg', 'images/image2.jpg', 'images/image.3jpg.jpg', 'images/image4.jpg', 'images/image5.jpg'],
  ['images/image6.jpg', 'images/image7.jpg', 'images/image8.jpg', 'images/image9.jpg', 'images/image10.jpg']
];

let currentBlobPage = 0;
let isBlobAnimating = false;

function updateBlobIndicator(index) {
  blobDots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === index);
  });
  if (blobDots[index] && blobActiveIndicator) {
    const pillRect = blobActiveIndicator.parentElement.getBoundingClientRect();
    const dotRect = blobDots[index].getBoundingClientRect();
    const borderLeft = parseFloat(getComputedStyle(blobActiveIndicator.parentElement).borderLeftWidth) || 0;
    
    const targetLeft = dotRect.left - pillRect.left - borderLeft;
    const targetWidth = dotRect.width;
    const currentLeft = parseFloat(getComputedStyle(blobActiveIndicator).left) || targetLeft;
    const currentWidth = parseFloat(getComputedStyle(blobActiveIndicator).width) || targetWidth;
    
    blobActiveIndicator.style.setProperty('--start-left', `${currentLeft}px`);
    blobActiveIndicator.style.setProperty('--start-width', `${currentWidth}px`);
    
    const minLeft = Math.min(currentLeft, targetLeft);
    const maxRight = Math.max(currentLeft + currentWidth, targetLeft + targetWidth);
    blobActiveIndicator.style.setProperty('--min-left', `${minLeft}px`);
    blobActiveIndicator.style.setProperty('--stretch-width', `${maxRight - minLeft}px`);
    
    blobActiveIndicator.style.setProperty('--end-left', `${targetLeft}px`);
    blobActiveIndicator.style.setProperty('--end-width', `${targetWidth}px`);
    
    blobActiveIndicator.classList.remove('is-stretching');
    void blobActiveIndicator.offsetWidth; // reflow
    blobActiveIndicator.classList.add('is-stretching');
  }
}

async function goToBlobPage(pageIndex) {
  if (isBlobAnimating || pageIndex === currentBlobPage || pageIndex < 0 || pageIndex >= blobPages.length) return;
  isBlobAnimating = true;
  
  blobPrevBtn.style.opacity = pageIndex === 0 ? '0.3' : '1';
  blobPrevBtn.style.pointerEvents = pageIndex === 0 ? 'none' : 'auto';
  blobNextBtn.style.opacity = pageIndex === blobPages.length - 1 ? '0.3' : '1';
  blobNextBtn.style.pointerEvents = pageIndex === blobPages.length - 1 ? 'none' : 'auto';
  
  updateBlobIndicator(pageIndex);
  
  currentBlobPage = pageIndex;
  
  blobImageCards.forEach((img, i) => {
    img.src = blobPages[pageIndex][i];
  });
  
  isBlobAnimating = false;
}

if (blobPrevBtn && blobNextBtn) {
  blobPrevBtn.style.opacity = '0.3';
  blobPrevBtn.style.pointerEvents = 'none';
  
  blobPrevBtn.addEventListener('click', () => goToBlobPage(currentBlobPage - 1));
  blobNextBtn.addEventListener('click', () => goToBlobPage(currentBlobPage + 1));
  
  blobDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (index < blobPages.length) {
        goToBlobPage(index);
      }
    });
  });
}

/* ---------- Past Experience Bubbles Interaction ---------- */
const expBubbles = document.querySelectorAll('.exp-liquid-bubble');
const expExpandedView = document.getElementById('exp-expanded-view');
const expBackBtn = document.getElementById('exp-back-btn');
const expInteractiveContainer = document.getElementById('exp-interactive-container');
const expContentBoxes = document.querySelectorAll('.exp-content-box');
let activeOriginalBlob = null; // Store reference to the clicked blob for shape syncing

// A tight, responsive multi-bounce spring!
// Reaches target at 400ms, peaks at 12% overshoot at 640ms, and settles smoothly.
const springEasing = 'linear(0.000 0%, 0.253 4%, 0.504 8%, 0.721 12%, 0.890 16%, 1.009 20%, 1.081 24%, 1.116 28%, 1.123 32%, 1.111 36%, 1.091 40%, 1.066 44%, 1.043 48%, 1.023 52%, 1.008 56%, 0.998 60%, 0.991 64%, 0.989 68%, 0.988 72%, 0.990 76%, 0.992 80%, 0.994 84%, 0.996 88%, 0.998 92%, 0.999 96%, 1.000 100%, 1 100%)';

if (expBubbles.length > 0 && expExpandedView && expBackBtn && expInteractiveContainer) {

  // Maintain a running z-index to ensure the last hovered bubble stays permanently on top
  let currentTopZ = 10;

  // Apply spring wobble to individual bubbles on hover
  expBubbles.forEach(bubble => {
    const iconWrapper = bubble.closest('.exp-bubble-wrapper');
    if (iconWrapper) {
      // Find the corresponding gooey wrapper to sync physics layer
      let gooeyWrapper = null;
      if (iconWrapper.classList.contains('exp-center-wrapper')) {
        gooeyWrapper = document.querySelector('.exp-gooey-layer .exp-center-wrapper');
      } else {
        const orbitClass = Array.from(iconWrapper.classList).find(c => c.startsWith('orbit-'));
        if (orbitClass) gooeyWrapper = document.querySelector(`.exp-gooey-layer .${orbitClass}`);
      }
      
      const state = { current: 1, velocity: 0, target: 1, raf: null };
      
      bubble.addEventListener('mouseenter', () => {
        // Bump z-index permanently to make it the top-most
        currentTopZ++;
        iconWrapper.style.zIndex = currentTopZ;

        state.target = 0;
        animatePlayback();
      });
      
      bubble.addEventListener('mouseleave', () => {
        state.target = 1;
        animatePlayback();
      });
      
      function animatePlayback() {
        if (state.raf) cancelAnimationFrame(state.raf);
        
        const getAnim = (wrapper) => {
          if (!wrapper) return null;
          const anims = wrapper.getAnimations();
          return anims.find(a => a.animationName && a.animationName.startsWith('orbit'));
        };
        
        const iconAnim = getAnim(iconWrapper);
        const gooeyAnim = getAnim(gooeyWrapper);
        
        const tension = 0.12;
        const friction = 0.82;
        
        const tick = () => {
          const force = (state.target - state.current) * tension;
          state.velocity = (state.velocity + force) * friction;
          state.current += state.velocity;
          
          if (iconAnim) iconAnim.playbackRate = state.current;
          if (gooeyAnim) gooeyAnim.playbackRate = state.current;
          
          if (Math.abs(state.target - state.current) > 0.001 || Math.abs(state.velocity) > 0.001) {
            state.raf = requestAnimationFrame(tick);
          } else {
            if (iconAnim) iconAnim.playbackRate = state.target;
            if (gooeyAnim) gooeyAnim.playbackRate = state.target;
            state.current = state.target;
            state.velocity = 0;
          }
        };
        state.raf = requestAnimationFrame(tick);
      }
    }
  });

  expBubbles.forEach(bubble => {
    bubble.addEventListener('click', (e) => {
      const targetId = bubble.getAttribute('data-target');
      if (!targetId) return;

      // FLIP-like animation: Create a giant blob starting from the clicked bubble
      const rect = bubble.getBoundingClientRect();
      const containerRect = expInteractiveContainer.getBoundingClientRect();
      const gooeyLayer = document.querySelector('.exp-gooey-layer');
      const gooeyRect = gooeyLayer.getBoundingClientRect();
      
      let giantBlob = document.getElementById('exp-giant-blob');
      if (!giantBlob) {
        giantBlob = document.createElement('div');
        giantBlob.id = 'exp-giant-blob';
        giantBlob.className = 'exp-giant-blob';
        document.querySelector('.exp-gooey-layer').appendChild(giantBlob);
      }
      
      const blobCenterX = rect.left + rect.width / 2 - gooeyRect.left;
      const blobCenterY = rect.top + rect.height / 2 - gooeyRect.top;

      const containerCenterX = rect.left + rect.width / 2 - containerRect.left;
      const containerCenterY = rect.top + rect.height / 2 - containerRect.top;
      
      giantBlob.style.transition = 'none';
      giantBlob.style.left = `${blobCenterX}px`;
      giantBlob.style.top = `${blobCenterY}px`;
      giantBlob.style.width = `${rect.width}px`;
      giantBlob.style.height = `${rect.height}px`;
      giantBlob.style.transform = 'translate(-50%, -50%) scale(1)';
      giantBlob.style.opacity = '1';
      
      // Store initial coordinates and active blob reference for the reverse animation
      activeOriginalBlob = bubble.querySelector('.exp-gooey-blob') || bubble.querySelector('.exp-liquid-bubble') || bubble;
      giantBlob.dataset.startX = blobCenterX;
      giantBlob.dataset.startY = blobCenterY;

      // Freeze ALL orbit wrappers in place so they stop moving while expanded
      document.querySelectorAll('.exp-orbit-wrapper').forEach(orbit => {
        orbit.style.animationPlayState = 'paused';
      });

      // Find the targeted content box to measure its height dynamically
      const targetBox = document.getElementById(targetId);
      let contentWidth = 500;
      let contentHeight = 350;
      
      if (targetBox) {
        const innerBlock = targetBox.querySelector('.section-block');
        
        // Temporarily prepare it for measurement
        targetBox.style.display = 'flex';
        targetBox.style.position = 'absolute';
        targetBox.style.visibility = 'hidden';
        targetBox.style.width = 'fit-content';
        targetBox.style.height = 'auto';
        targetBox.style.paddingTop = '60px'; // Push text down away from the back button
        targetBox.style.maxWidth = `${Math.min(560, containerRect.width * 0.8)}px`; 
        
        if (innerBlock) innerBlock.style.display = 'inline-block'; // shrink-wrap text
        
        contentWidth = targetBox.offsetWidth;
        contentHeight = targetBox.offsetHeight;
        
        // Reset properties
        targetBox.style.display = '';
        targetBox.style.position = '';
        targetBox.style.visibility = '';
        targetBox.style.width = '';
        targetBox.style.height = '';
        targetBox.style.paddingTop = '';
        targetBox.style.maxWidth = '';
        if (innerBlock) innerBlock.style.display = '';
      }
      
      // Calculate the raw diagonal of the tightly wrapped content
      const diagonal = Math.sqrt(contentWidth * contentWidth + contentHeight * contentHeight);
      
      // Calculate targetSize using just the diagonal plus a minimal buffer
      let targetSize = Math.ceil(diagonal + 80); 
      targetSize = Math.max(500, Math.min(targetSize, containerRect.width * 0.95));
      
      // Expand container background if needed
      let newContainerHeight = 560;
      if (targetSize > 560) {
        newContainerHeight = targetSize + 40;
        expInteractiveContainer.style.minHeight = `${newContainerHeight}px`;
      } else {
        expInteractiveContainer.style.minHeight = '560px';
      }
      
      const newCenterY = newContainerHeight / 2;
      
      const scaleFactor = targetSize / rect.width;
      
      giantBlob.style.transition = `all 2000ms ${springEasing}`;
      giantBlob.style.left = '50%';
      giantBlob.style.top = '50%';
      giantBlob.style.transform = `translate(-50%, -50%) scale(${scaleFactor})`;

      // Update exp-expanded-view size dynamically
      expExpandedView.style.width = `${targetSize}px`;
      expExpandedView.style.height = `${targetSize}px`;

      // Animate the back button to dynamically ride the top-left corner of the blob
      const backBtn = document.getElementById('exp-back-btn');
      
      // Calculate top-left anchored offset for the initial clicked bubble
      const startOffset = rect.width * 0.16;
      const startX = containerCenterX - rect.width / 2 + startOffset;
      const startY = containerCenterY - rect.height / 2 + startOffset;
      
      // Calculate top-left anchored offset for the final giant blob using the NEW center
      const endOffset = targetSize * 0.16;
      const endX = (containerRect.width / 2) - (targetSize / 2) + endOffset;
      const endY = newCenterY - (targetSize / 2) + endOffset;
      
      // Set initial position and clear any inline hide properties
      backBtn.style.transition = 'none';
      backBtn.style.opacity = '';
      backBtn.style.visibility = '';
      backBtn.style.left = `${startX}px`;
      backBtn.style.top = `${startY}px`;
      
      // Store start position for the reverse animation
      backBtn.dataset.startX = startX;
      backBtn.dataset.startY = startY;
      
      void backBtn.offsetWidth; // reflow
      
      // Transition along with the blob
      backBtn.style.transition = `all 2000ms ${springEasing}, background 200ms ease, transform 200ms ease`;
      backBtn.style.left = `${endX}px`;
      backBtn.style.top = `${endY}px`;

      // Hide all content boxes
      expContentBoxes.forEach(box => {
        box.classList.remove('is-active');
      });

      // Show the targeted content box
      if (targetBox) {
        targetBox.style.maxWidth = `${Math.min(560, containerRect.width * 0.8)}px`; // Apply max-width
        targetBox.classList.add('is-active');
      }

      // Calculate wipe origin dynamically based on clicked bubble's coordinates relative to the expanded view
      const viewWidth = expExpandedView.offsetWidth || targetSize;
      const viewHeight = expExpandedView.offsetHeight || targetSize;
      const viewLeft = containerRect.width / 2 - viewWidth / 2;
      const viewTop = newCenterY - viewHeight / 2;
      
      const wipeX = ((containerCenterX - viewLeft) / viewWidth) * 100;
      const wipeY = ((containerCenterY - viewTop) / viewHeight) * 100;
      
      expExpandedView.style.setProperty('--wipe-x', `${wipeX}%`);
      expExpandedView.style.setProperty('--wipe-y', `${wipeY}%`);

      // Morph the container
      expInteractiveContainer.classList.add('is-morphed');
      expExpandedView.classList.add('is-active');

      // Auto-scroll to perfectly center the final expanded blob inside the visual screen space
      const topBar = document.querySelector('.top-bar');
      const OFFSET = topBar ? topBar.offsetHeight : 80;
      
      const absoluteTop = containerRect.top + window.scrollY;
      const visualScreenHeight = window.innerHeight - OFFSET;
      
      const targetScrollTop = absoluteTop + (newContainerHeight / 2) - OFFSET - (visualScreenHeight / 2);
      setTimeout(() => {
        window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }, 60);
    });
    
    // Keyboard support
    bubble.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        bubble.click();
      }
    });
  });

  expBackBtn.addEventListener('click', () => {
    // Scroll back to the "Past Experience" heading using a delayed standard smooth scroll
    setTimeout(() => {
      const experienceHeading = document.getElementById('experience');
      if (experienceHeading) {
        const topBar = document.querySelector('.top-bar');
        const OFFSET = topBar ? topBar.offsetHeight : 80;
        const targetScrollTop = experienceHeading.getBoundingClientRect().top + window.pageYOffset - OFFSET - 30;
        window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    }, 800);

    expInteractiveContainer.classList.add('is-handoff');

    // Delay removing is-morphed until the giant blob finishes its bounce, so the background text doesn't fade in early
    setTimeout(() => {
      expInteractiveContainer.classList.remove('is-morphed');
      expInteractiveContainer.style.minHeight = '560px';
    }, 1000);
    expExpandedView.classList.remove('is-active');
    
    // Reverse the giant blob animation
    const giantBlob = document.getElementById('exp-giant-blob');
    if (giantBlob) {
      const currentTransform = giantBlob.style.transform;
      const startX = giantBlob.dataset.startX;
      const startY = giantBlob.dataset.startY;

      // Smoothly glide coordinates back to the origin
      giantBlob.style.transition = 'left 1500ms ease-in-out, top 1500ms ease-in-out';
      giantBlob.style.left = `${startX}px`;
      giantBlob.style.top = `${startY}px`;
      
      // Set the final inline transform explicitly so it doesn't snap when WAAPI finishes
      giantBlob.style.transform = 'translate(-50%, -50%) scale(1)';
      
      // Animate ONLY the transform to provide a clean scale bounce
      giantBlob.animate([
        { transform: currentTransform },
        { transform: 'translate(-50%, -50%) scale(0.95)', offset: 0.6 },
        { transform: 'translate(-50%, -50%) scale(1.10)', offset: 0.8 },
        { transform: 'translate(-50%, -50%) scale(1)' }
      ], {
        duration: 1500,
        easing: 'ease-in-out'
      });
      
      // Start crossfading the giant blob into the normal blob 300ms before the end of the bounce
      // This creates a seamless visual handoff, masking any organic shape differences
      setTimeout(() => {
        if (giantBlob) {
          giantBlob.style.transition = 'left 1500ms ease-in-out, top 1500ms ease-in-out, opacity 300ms ease';
          giantBlob.style.opacity = '0';
        }
      }, 1200);
    }

    // Disable pointer events during the closing animation to prevent accidental hover flickers
    expInteractiveContainer.style.pointerEvents = 'none';
    setTimeout(() => {
      expInteractiveContainer.style.pointerEvents = '';
    }, 1500);

    // Fade out the back button almost instantly so it doesn't look disconnected from the shrinking blob
    const dynamicBackBtn = document.getElementById('exp-back-btn');
    if (dynamicBackBtn) {
      dynamicBackBtn.style.transition = 'opacity 100ms ease, visibility 100ms ease';
      dynamicBackBtn.style.opacity = '0';
      dynamicBackBtn.style.visibility = 'hidden';
    }

    // Simply resume the orbit animations after the closing animation finishes
    setTimeout(() => {
      expInteractiveContainer.classList.remove('is-handoff');
      document.querySelectorAll('.exp-orbit-wrapper').forEach(orbit => {
        orbit.style.animationPlayState = window._isExpInView ? '' : 'paused';
      });
    }, 1500);
    
    // Clear active states from content boxes ONLY after the wipe out animation completes
    setTimeout(() => {
      if (!expExpandedView.classList.contains('is-active')) {
        expContentBoxes.forEach(box => {
          box.classList.remove('is-active');
        });
      }
    }, 1500);
  });

  window._isExpInView = true;
  const expObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      window._isExpInView = entry.isIntersecting;
      if (!expExpandedView.classList.contains('is-active')) {
        document.querySelectorAll('.exp-orbit-wrapper').forEach(orbit => {
          orbit.style.animationPlayState = window._isExpInView ? '' : 'paused';
        });
      }
    });
  }, { threshold: 0 });
  expObserver.observe(expInteractiveContainer);
}
