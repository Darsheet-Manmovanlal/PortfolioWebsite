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

/* ---------- Search Bar Functionality ---------- */
const searchBarInput = document.querySelector('.search-bar');
if (searchBarInput) {
  function clearHighlights() {
    document.querySelectorAll('mark.search-highlight').forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function highlightText(node, query) {
    if (!query) return 0;
    if (node.nodeType === 3) {
      const text = node.nodeValue;
      const matchIndex = text.toLowerCase().indexOf(query.toLowerCase());
      if (matchIndex >= 0) {
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.style.backgroundColor = '#fdfd96'; // pastel yellow
        mark.style.color = '#111';
        mark.style.borderRadius = '2px';
        mark.style.padding = '0 2px';
        
        const middle = node.splitText(matchIndex);
        middle.splitText(query.length);
        
        const middleClone = middle.cloneNode(true);
        mark.appendChild(middleClone);
        middle.parentNode.replaceChild(mark, middle);
        return 1;
      }
    } else if (node.nodeType === 1 && node.childNodes && !/(script|style|mark)/i.test(node.tagName)) {
      for (let i = 0; i < node.childNodes.length; i++) {
        i += highlightText(node.childNodes[i], query);
      }
    }
    return 0;
  }

  searchBarInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearHighlights();
    if (query) {
      // Highlight inside the main container
      const container = document.querySelector('main.container');
      if (container) {
        highlightText(container, query);
      }
    }
  });

  searchBarInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstHighlight = document.querySelector('mark.search-highlight');
      if (firstHighlight) {
        const topBar = document.querySelector('.top-bar');
        const OFFSET = topBar ? topBar.offsetHeight : 80;
        const y = firstHighlight.getBoundingClientRect().top + window.pageYOffset - OFFSET - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  });
}

