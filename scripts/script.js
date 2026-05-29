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

    const rect = topBar.getBoundingClientRect();
    const probeX = window.innerWidth / 2;
    const probeY = rect.bottom + 2;

    topBar.style.visibility = 'hidden';
    const elementBelow = document.elementFromPoint(probeX, probeY);
    topBar.style.visibility = 'visible';

    const bgColor = findBackgroundColor(elementBelow || document.documentElement);
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

/* ---------- Music Player Toggle ---------- */
const musicBtn = document.getElementById('about-music-play');
const musicProgress = document.getElementById('about-music-progress');

if (musicBtn && musicProgress) {
  let playing = false;
  let progressVal = 0;
  let progressInterval = null;

  const startProgress = () => {
    if (progressInterval) return;
    progressInterval = setInterval(() => {
      progressVal = Math.min(100, progressVal + 0.5);
      musicProgress.style.width = progressVal + '%';
      if (progressVal >= 100) {
        stopProgress();
        musicBtn.classList.remove('is-playing');
        playing = false;
        progressVal = 0;
        musicProgress.style.width = '0%';
      }
    }, 200);
  };

  const stopProgress = () => {
    clearInterval(progressInterval);
    progressInterval = null;
  };

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playing = !playing;
    musicBtn.classList.toggle('is-playing', playing);
    if (playing) {
      startProgress();
    } else {
      stopProgress();
    }
  });

  /* Expand permanently on first hover */
  const aboutSection = document.getElementById('about-section');
  if (aboutSection) {
    aboutSection.addEventListener('mouseenter', () => {
      aboutSection.classList.add('is-expanded');
    }, { once: true });
  }
}

/* ---------- Image Viewer Logic ---------- */
const imageViewer = document.getElementById('about-image-viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerBackBtn = document.getElementById('viewer-back-btn');
const aboutExpanded = document.querySelector('.about-expanded');
const imageCards = document.querySelectorAll('.about-card-image');

if (imageViewer && viewerImage && viewerBackBtn && aboutExpanded) {
  const TRANSITION_DURATION = 500;
  const FADE_DURATION = 350;

  let activeCard = null;
  let activeSourceRect = null;
  let idleSourceRect = null;
  let isAnimating = false;

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
    
    const maxWidth = containerRect.width - paddingX - 40;
    const maxHeight = containerRect.height - paddingY - 40;
    
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

  imageCards.forEach((img) => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isAnimating) return;

      const card = img.closest('.about-card');
      if (!card) return;

      if (!img.complete) return; // Basic safety check
      isAnimating = true;
      activeCard = card;
      activeSourceRect = getCardRect(card);
      idleSourceRect = getIdleCardRect(card, activeSourceRect.centerX, activeSourceRect.centerY);

      viewerImage.src = img.src;
      viewerImage.alt = img.alt || 'Expanded View';

      const targetRect = getExpandedRect(activeSourceRect, img.naturalWidth, img.naturalHeight);

      imageViewer.style.transition = 'none';
      imageViewer.style.visibility = 'visible';
      setViewerBounds(activeSourceRect);

      void imageViewer.offsetWidth;

      imageViewer.style.transition = [
        `left ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        `top ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        `width ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        `height ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        `transform ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
      ].join(', ');
      setViewerBounds(targetRect);
      imageViewer.classList.add('is-active');
      card.classList.add('is-active');
      aboutExpanded.classList.add('viewer-active');

      setTimeout(() => {
        isAnimating = false;
      }, TRANSITION_DURATION);
    });
  });

  viewerBackBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isAnimating) return;
    isAnimating = true;

    if (activeCard && idleSourceRect) {
      setViewerBounds(idleSourceRect);
    }

    imageViewer.classList.remove('is-active');
    aboutExpanded.classList.remove('viewer-active');

    if (activeCard) {
      activeCard.classList.remove('is-active');
    }

    setTimeout(() => {
      imageViewer.style.transition = 'none';
      imageViewer.style.left = '0px';
      imageViewer.style.top = '0px';
      imageViewer.style.width = '0px';
      imageViewer.style.height = '0px';
      imageViewer.style.visibility = 'hidden';
      imageViewer.style.transform = '';
      viewerImage.src = '';
      void imageViewer.offsetWidth;
      imageViewer.style.transition = '';
      activeCard = null;
      activeSourceRect = null;
      idleSourceRect = null;
      isAnimating = false;
    }, TRANSITION_DURATION + 50);
  });

  // Close when clicking outside the expanded image
  document.addEventListener('click', (e) => {
    if (imageViewer.classList.contains('is-active') && !isAnimating) {
      if (e.target !== viewerImage && e.target !== viewerBackBtn && !viewerBackBtn.contains(e.target)) {
        viewerBackBtn.click();
      }
    }
  });
}


