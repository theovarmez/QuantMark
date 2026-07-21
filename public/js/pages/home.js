route('/', async () => {
  document.getElementById('app-outlet').innerHTML = `
  <main class="container-padding" style="max-width:1400px;margin:0 auto;padding-top:4rem;padding-bottom:4rem;">
    <!-- Hero -->
    <section style="text-align:center;margin-bottom:6rem;">
      <div style="position:relative;display:inline-block;">
        <h1 class="headline-lg dot-matrix" style="font-size:clamp(3rem,10vw,120px);user-select:none;">QuantMark</h1>
        <span style="position:absolute;right:-1rem;top:0;width:1rem;height:1rem;background:var(--nothing-red);border-radius:50%;animation:ping 2s infinite;box-shadow:0 0 15px rgba(255,0,49,0.8);"></span>
      </div>
      <p class="data-mono" style="color:var(--outline);margin:1.5rem auto 3rem;max-width:600px;font-size:1.125rem;text-transform:uppercase;letter-spacing:0.1em;">
        Registro público de watermarking para modelos de IA de trading
      </p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
        <a href="#/register" class="btn btn-red" style="padding:1rem 2.5rem;font-size:1rem;">
          <span>REGISTRAR EMPRESA</span>
          <span class="material-symbols-outlined">arrow_forward</span>
        </a>
        <a href="#/login" class="btn btn-ghost" style="padding:1rem 2.5rem;font-size:1rem;">
          <span>YA TENGO API KEY</span>
        </a>
      </div>
    </section>

    <!-- Bento Features -->
    <div class="bento-grid" style="auto-rows:160px;">
      <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);display:flex;flex-direction:column;justify-content:space-between;grid-column:span 2;grid-row:span 2;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <span class="label-caps" style="color:var(--nothing-red);">01 / REGISTRO</span>
          <span class="material-symbols-outlined" style="font-size:2.5rem;">fingerprint</span>
        </div>
        <div>
          <h3 class="headline-sm" style="text-transform:uppercase;">Watermark IDs Públicos</h3>
          <p style="color:var(--outline);font-size:14px;">Cada modelo recibe un serial único QM-XXXX-XXXX. Consulta el registro público de IDs activos.</p>
        </div>
      </div>

      <div class="glass" style="border-radius:1rem;display:flex;flex-direction:column;align-items:center;justify-content:center;grid-column:span 1;grid-row:span 1;overflow:hidden;position:relative;">
        <span class="mono" style="font-size:2.5rem;">+1.2K</span>
        <span class="label-caps" style="color:var(--outline);">MODELOS</span>
      </div>

      <div class="glass" style="border-radius:1rem;display:flex;flex-direction:column;align-items:center;justify-content:center;grid-column:span 1;grid-row:span 1;background:var(--nothing-red);color:white;">
        <span class="material-symbols-outlined" style="font-size:2rem;margin-bottom:0.5rem;">shield</span>
        <span class="label-caps" style="font-size:10px;">SEGURO</span>
      </div>

      <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);display:flex;flex-direction:column;justify-content:flex-end;grid-column:span 2;grid-row:span 2;overflow:hidden;position:relative;">
        <div style="position:absolute;inset:0;opacity:0.1;background:linear-gradient(135deg,var(--nothing-red),transparent 50%);"></div>
        <span class="label-caps" style="color:var(--primary);margin-bottom:0.5rem;">API FIRST</span>
        <h3 class="headline-sm" style="text-transform:uppercase;">Integración Simple</h3>
        <p style="color:var(--outline);font-size:14px;">Registra movimientos, reporta uso sospechoso, genera certificados con valor probatorio.</p>
      </div>

      <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);display:flex;align-items:center;justify-content:space-between;grid-column:span 2;grid-row:span 1;">
        <div>
          <span class="label-caps" style="color:var(--outline);font-size:10px;">GRATUITO</span>
          <span class="headline-sm" style="display:block;">Sin costo</span>
        </div>
        <div style="display:flex;gap:4px;">
          <span style="width:6px;height:8px;background:var(--primary);border-radius:4px;opacity:0.3;"></span>
          <span style="width:6px;height:12px;background:var(--primary);border-radius:4px;opacity:0.6;"></span>
          <span style="width:6px;height:16px;background:var(--nothing-red);border-radius:4px;"></span>
          <span style="width:6px;height:6px;background:var(--primary);border-radius:4px;opacity:0.2;"></span>
        </div>
      </div>

      <a href="#/search" class="glass" style="border-radius:9999px;display:flex;align-items:center;justify-content:center;grid-column:span 1;grid-row:span 1;aspect-ratio:1;cursor:pointer;text-decoration:none;">
        <span class="material-symbols-outlined" style="font-size:2rem;">search</span>
      </a>
      <a href="#/analytics" class="glass" style="border-radius:9999px;display:flex;align-items:center;justify-content:center;grid-column:span 1;grid-row:span 1;aspect-ratio:1;cursor:pointer;text-decoration:none;">
        <span class="material-symbols-outlined" style="font-size:2rem;">analytics</span>
      </a>

      <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);display:flex;flex-direction:column;justify-content:space-between;grid-column:span 2;grid-row:span 2;background:var(--pure-black);border-color:var(--border-subtle);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="label-caps">Monitoring Feed</span>
          <div style="display:flex;gap:4px;align-items:center;">
            <span class="dot dot-live"></span>
            <span class="label-caps" style="color:var(--nothing-red);font-size:8px;">LIVE</span>
          </div>
        </div>
        <div class="mono" style="font-size:11px;color:var(--outline);">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--white-05);padding:4px 0;">
            <span>WM: QM-8F2A-91C0</span>
            <span style="color:var(--primary);">VERIFIED</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--white-05);padding:4px 0;">
            <span>WM: QM-3B7C-42D1</span>
            <span style="color:var(--primary);">VERIFIED</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--white-05);padding:4px 0;">
            <span>WM: QM-9E1F-75A3</span>
            <span style="color:var(--nothing-red);">REPORTED</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span>WM: QM-6D4G-88B9</span>
            <span style="color:var(--primary);">VERIFIED</span>
          </div>
        </div>
        <h4 class="label-caps" style="color:var(--primary);">Monitoreo en Tiempo Real</h4>
      </div>

      <a href="#/register" class="glass-white" style="border-radius:1rem;grid-column:span 2;grid-row:span 1;display:flex;align-items:center;justify-content:space-between;padding:var(--inner-padding);cursor:pointer;overflow:hidden;position:relative;text-decoration:none;">
        <span class="headline-sm" style="position:relative;z-index:1;">Empezar ahora</span>
        <span class="material-symbols-outlined" style="font-size:2rem;position:relative;z-index:1;">rocket_launch</span>
      </a>
    </div>

    <footer style="display:flex;justify-content:space-between;align-items:center;padding:2rem 0;margin-top:4rem;border-top:1px solid var(--white-05);opacity:0.4;font-size:12px;">
      <span class="mono">&copy; 2026 QuantMark. Open Source.</span>
      <div style="display:flex;gap:1rem;">
        <a href="https://github.com" target="_blank" class="mono" style="color:var(--outline);text-decoration:none;">GitHub</a>
        <a href="#/docs" class="mono" style="color:var(--outline);text-decoration:none;">API Docs</a>
      </div>
    </footer>
  </main>`;
});
