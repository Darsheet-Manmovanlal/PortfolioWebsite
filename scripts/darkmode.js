/*
  darkmode.js
  - Handles dark mode toggle and persistence.
  - Syncs with the adaptive top bar glass effect.
*/

const isDarkMode = localStorage.getItem('dark-mode') === 'true';

if (isDarkMode) {
  document.documentElement.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark-mode');
      const isNowDark = document.documentElement.classList.contains('dark-mode');
      localStorage.setItem('dark-mode', isNowDark);
    });
  }
});
