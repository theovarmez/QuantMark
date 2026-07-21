const routes = {};

function route(path, renderFn) {
  routes[path] = renderFn;
}

function navigate(path) {
  window.location.hash = path;
}

async function resolve() {
  const hash = window.location.hash.slice(1) || '/';
  const outlet = document.getElementById('app-outlet');
  if (!outlet) return;

  // Check auth for protected routes
  const protectedRoutes = ['/dashboard', '/models', '/ids', '/reports', '/settings'];
  const isProtected = protectedRoutes.some(p => hash.startsWith(p));
  if (isProtected && !isLoggedIn()) {
    navigate('/login');
    return;
  }

  // If logged in and on landing/login/register, redirect to dashboard
  if (isLoggedIn() && (hash === '/' || hash === '/login' || hash === '/register')) {
    navigate('/dashboard');
    return;
  }

  // Find matching route (exact or prefix for param routes)
  let renderFn = routes[hash];
  if (!renderFn) {
    for (const [pattern, fn] of Object.entries(routes)) {
      if (pattern.includes(':') && hash.startsWith(pattern.split(':')[0])) {
        renderFn = fn;
        break;
      }
    }
  }

  if (!renderFn) renderFn = routes['/'];

  outlet.innerHTML = '<div class="container-padding"><p class="mono" style="padding:2rem;text-align:center;">Loading...</p></div>';

  try {
    await renderFn(hash);
  } catch (err) {
    outlet.innerHTML = `<div class="container-padding"><div class="glass inner-padding" style="border-radius:1rem;text-align:center;color:var(--nothing-red);">
      <span class="material-symbols-outlined" style="font-size:48px;">error</span>
      <p class="mono">${err.message}</p>
    </div></div>`;
  }
}

function initRouter() {
  window.addEventListener('hashchange', resolve);
  window.addEventListener('load', resolve);
}
