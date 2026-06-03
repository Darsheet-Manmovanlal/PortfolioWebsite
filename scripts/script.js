// Smooth scroll with offset for topbar anchor links
document.addEventListener('DOMContentLoaded', function () {
  const topBar = document.querySelector('.top-bar');
  const OFFSET = topBar?.offsetHeight || 80;
  document.querySelectorAll('.top-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      const target = document.getElementById(targetId) || document.querySelector(`[id="${targetId}"]`);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.pageYOffset - OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
        history.replaceState(null, '', '#' + targetId);
      }
    });
  });
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
}

/* ---------- About Section Scroll Animations ---------- */
const aboutSection = document.getElementById('about-section');
const heroSection = document.querySelector('.hero');
const fixedDecorations = document.getElementById('fixed-decorations');
const aboutDecorations = document.getElementById('about-decorations');
const skillsSection = document.getElementById('skills');

if (aboutSection && heroSection && topBar) {
  const skillsPanel = skillsSection ? skillsSection.closest('.section-panel') : null;
  const skillsListItems = skillsPanel ? skillsPanel.querySelectorAll('li') : [];
  const lastSkill = skillsListItems.length > 0 ? skillsListItems[skillsListItems.length - 1] : null;

  let arrowsInitialized = false;

  const handleScrollAnimations = () => {
    if (!aboutSection || !heroSection || !topBar) return;

    const topBarBottom = window.scrollY + topBar.offsetHeight;
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;

    const pastHero = topBarBottom >= heroBottom;
    let pastSkills = false;

    // Scroll down past last skill
    if (lastSkill) {
      const lastSkillRect = lastSkill.getBoundingClientRect();
      if (lastSkillRect.bottom < window.innerHeight - 50) {
        pastSkills = true;
      }
    }

    // About section blob expansion (expands once and stays expanded)
    if (pastHero) {
      if (!aboutSection.classList.contains('is-expanded')) {
        aboutSection.classList.add('is-expanded');

        // Re-evaluate scroll logic during the CSS transition (1200ms)
        // so that elements pushed down by the expansion update correctly
        const startTime = performance.now();
        const tick = (now) => {
          handleScrollAnimations();
          if (now - startTime < 1300) {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      }

      // Ensure arrows are started only once when in view
      if (!arrowsInitialized && fixedDecorations) {
        startDynamicArrows();
        arrowsInitialized = true;
      }
    }

    // Decorations visibility (hides if past skills)
    if (!pastSkills) {
      if (fixedDecorations) {
        fixedDecorations.classList.remove('fade-out');
      }
      if (aboutDecorations) {
        aboutDecorations.classList.remove('fade-out');
      }
    } else {
      if (fixedDecorations) {
        fixedDecorations.classList.add('fade-out');
      }
      if (aboutDecorations) {
        aboutDecorations.classList.add('fade-out');
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
          
          const startLeft = startDot.offsetLeft;
          const endLeft = endDot.offsetLeft;
          
          const minLeft = Math.min(startLeft, endLeft);
          const maxRight = Math.max(startLeft + startDot.offsetWidth, endLeft + endDot.offsetWidth);
          const stretchWidth = maxRight - minLeft;
          
          indicator.style.setProperty('--start-left', `${startLeft}px`);
          indicator.style.setProperty('--start-width', `${startDot.offsetWidth}px`);
          
          indicator.style.setProperty('--min-left', `${minLeft}px`);
          indicator.style.setProperty('--stretch-width', `${stretchWidth}px`);
          
          indicator.style.setProperty('--end-left', `${endLeft}px`);
          indicator.style.setProperty('--end-width', `${endDot.offsetWidth}px`);
          
          indicator.classList.remove('is-stretching');
          void indicator.offsetWidth; // Force reflow
          indicator.classList.add('is-stretching');
        } else {
          indicator.style.setProperty('--end-left', `${dot.offsetLeft}px`);
          indicator.style.setProperty('--end-width', `${dot.offsetWidth}px`);
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
  const searchableElements = document.querySelectorAll('.section-block, .content-list li, .about-section p');
  
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
      scrollContainer.style.display = 'none';
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
      scrollContainer.style.display = 'none';
      return;
    }
    if (isDragging) return;

    const containerHeight = positionScrollContainer();
    if (containerHeight <= 0) return;

    scrollContainer.style.display = 'block';
    // Thumb height proportional to viewport
    let thumbHeight = Math.max(30, (window.innerHeight / document.documentElement.scrollHeight) * containerHeight);
    scrollThumb.style.height = `${thumbHeight}px`;

    const scrollRatio = window.scrollY / scrollHeight;
    const maxTop = containerHeight - thumbHeight;
    scrollThumb.style.top = `${scrollRatio * maxTop}px`;
  };

  window.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  // Initial calculation
  setTimeout(updateThumb, 100);

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
