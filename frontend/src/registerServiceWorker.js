export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  const register = async () => {
    try {
      await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  };

  if (document.readyState === 'complete') {
    void register();
    return;
  }

  window.addEventListener(
    'load',
    () => {
      void register();
    },
    { once: true },
  );
}
