const routes = {
  '/': () => import('./pages/openbrush/index'),
};

function handleRoute() {
  const path = window.location.pathname;
  const route = routes[path] || routes['/'];

  // Get app element
  const appElement = document.getElementById('app');
  if (appElement) {
    // Remove existing canvas if it exists
    const existingCanvas = document.getElementById('application-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    // Create a new canvas element for PlayCanvas
    const canvas = document.createElement('canvas');
    canvas.id = 'application-canvas';
    appElement.appendChild(canvas);
  }

  // Load and initialize the new route
  route().then(module => {
    module.init();
  });
}

// Initialize router
window.addEventListener('popstate', handleRoute);
document.addEventListener('DOMContentLoaded', handleRoute);

// Link handler for client-side navigation
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('/')) {
    e.preventDefault();
    const href = target.getAttribute('href') as string;
    // Instead of client-side navigation, perform a full page reload
    window.location.href = href;
  }
});
