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
