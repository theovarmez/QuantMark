route('/dashboard', async () => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = '<div class="container-padding"><p class="mono">Loading dashboard...</p></div>';

  try {
    const [models, ids] = await Promise.all([api.getModels(), api.getIds()]);
    const movements = ids.length > 0
      ? await api.getMovements(ids[0].id).catch(() => [])
      : [];
    const reports = await api.getReports().catch(() => []);

    const totalModels = models.length;
    const activeIds = ids.filter(i => i.status === 'active').length;
    const revokedIds = ids.filter(i => i.status === 'revoked').length;
    const totalReports = reports.length;

    outlet.innerHTML = `
    <div class="container-padding fade-in">
      <div class="bento-grid" style="auto-rows:160px;">
        <!-- Global Stats -->
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 3;grid-row:span 2;display:flex;flex-direction:column;justify-content:space-between;">
          <div style="display:flex;justify-content:space-between;">
            <span class="label-caps" style="color:var(--outline);">Global Stats</span>
            <span class="material-symbols-outlined">public</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;padding:1rem 0;">
            <div>
              <p class="label-caps" style="font-size:10px;color:var(--outline);">Models</p>
              <p class="headline-lg mono" style="letter-spacing:-0.05em;">${totalModels}</p>
            </div>
            <div>
              <p class="label-caps" style="font-size:10px;color:var(--outline);">Active IDs</p>
              <p class="headline-lg mono" style="letter-spacing:-0.05em;">${activeIds}</p>
            </div>
            <div>
              <p class="label-caps" style="font-size:10px;color:var(--outline);">Revoked</p>
              <p class="headline-lg mono" style="letter-spacing:-0.05em;color:var(--nothing-red);">${revokedIds}</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;border-top:1px solid var(--white-05);padding-top:0.75rem;">
            <span class="dot dot-live"></span>
            <span class="mono" style="font-size:11px;color:var(--primary);">${totalReports} reportes registrados</span>
          </div>
        </div>

        <!-- System Activity -->
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 2;grid-row:span 2;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;">
          <div style="position:absolute;inset:0;opacity:0.1;pointer-events:none;">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
              <div style="width:100%;height:100%;border:1px solid var(--border-subtle);border-radius:50%;animation:ping 2s infinite;"></div>
              <div style="position:absolute;width:80%;height:80%;border:1px solid var(--border-subtle);border-radius:50%;"></div>
            </div>
          </div>
          <span class="label-caps" style="color:var(--outline);margin-bottom:1.5rem;">System</span>
          <div style="width:120px;height:120px;border-radius:50%;border:1px solid var(--white-10);display:flex;align-items:center;justify-content:center;position:relative;">
            <div style="position:absolute;bottom:50%;left:50%;width:1px;height:60px;background:var(--nothing-red);transform-origin:bottom;animation: radarSpin 4s linear infinite;"></div>
            <span class="dot dot-live" style="width:12px;height:12px;"></span>
          </div>
          <p class="headline-sm mono" style="margin-top:1rem;">ONLINE</p>
        </div>

        <!-- API Status -->
        <div class="glass-red" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 1;grid-row:span 1;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;">
          <div style="display:flex;justify-content:space-between;">
            <span class="material-symbols-outlined" style="color:white;">key</span>
            <span class="dot dot-live"></span>
          </div>
          <div>
            <p class="label-caps" style="font-size:10px;color:white;opacity:0.8;">API</p>
            <p class="headline-sm" style="color:white;">ACTIVE</p>
          </div>
        </div>

        <!-- CPU -->
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 1;grid-row:span 1;display:flex;flex-direction:column;justify-content:space-between;">
          <span class="material-symbols-outlined" style="color:var(--outline);">memory</span>
          <div>
            <p class="label-caps" style="font-size:10px;color:var(--outline);">Models</p>
            <p class="headline-sm">${totalModels}</p>
          </div>
        </div>

        <!-- Recent Movements -->
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 4;grid-row:span 2;display:flex;flex-direction:column;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <span class="label-caps" style="color:var(--outline);">Recent Movements</span>
            <span class="label-caps" style="font-size:10px;color:var(--primary);cursor:pointer;" onclick="navigate('/ids')">VIEW ALL</span>
          </div>
          <div style="flex:1;overflow-y:auto;">
            ${movements.length === 0
              ? '<p class="mono" style="color:var(--outline);font-size:12px;">No movements yet</p>'
              : movements.slice(0, 5).map(m => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;border-bottom:1px solid var(--white-05);">
                  <div style="display:flex;align-items:center;gap:0.75rem;">
                    <span class="material-symbols-outlined" style="font-size:1.25rem;">swap_horiz</span>
                    <div>
                      <p class="mono" style="font-size:13px;">${m.event_type}</p>
                      <p class="mono" style="font-size:10px;color:var(--outline);">${new Date(m.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span class="badge badge-active" style="font-size:8px;">OK</span>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>

      <footer style="display:flex;justify-content:space-between;align-items:center;padding:1rem 0;margin-top:2rem;border-top:1px solid var(--white-05);opacity:0.4;font-size:12px;">
        <span class="mono">&copy; 2026 QuantMark</span>
        <span class="mono" style="color:var(--outline);">${new Date().toISOString().slice(0,10)}</span>
      </footer>
    </div>`;

    // Add radar style
    const style = document.createElement('style');
    style.textContent = `@keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  } catch (err) {
    outlet.innerHTML = `<div class="container-padding"><p class="mono" style="color:var(--nothing-red);">Error: ${err.message}</p></div>`;
  }
});
