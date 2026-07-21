route('/analytics', async () => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = '<div class="container-padding"><p class="mono">Loading analytics...</p></div>';

  try {
    const resp = await fetch(window.QUANTMARK_API + '/reports');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    const reports = await resp.json();
    const list = Array.isArray(reports) ? reports : [];

    const byCountry = {}, byCompany = {};
    list.forEach(r => {
      const c = r.country || 'Desconocido';
      byCountry[c] = (byCountry[c] || 0) + 1;
      const comp = r.company_name || 'Desconocido';
      byCompany[comp] = (byCompany[comp] || 0) + 1;
    });
    const countryEntries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]);
    const companyEntries = Object.entries(byCompany).sort((a, b) => b[1] - a[1]);

    outlet.innerHTML = `
    <div class="container-padding fade-in">
      <div style="margin-bottom:2rem;">
        <h1 class="headline-lg">Analytics</h1>
        <p class="mono" style="color:var(--outline);font-size:14px;">Reportes de leaks — ${list.length} total</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-bottom:2rem;">
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);text-align:center;">
          <p class="label-caps" style="font-size:10px;color:var(--outline);">Reportes</p>
          <p class="headline-lg mono" style="letter-spacing:-0.05em;">${list.length}</p>
        </div>
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);text-align:center;">
          <p class="label-caps" style="font-size:10px;color:var(--outline);">Paises</p>
          <p class="headline-lg mono" style="letter-spacing:-0.05em;">${countryEntries.length}</p>
        </div>
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);text-align:center;">
          <p class="label-caps" style="font-size:10px;color:var(--outline);">Empresas</p>
          <p class="headline-lg mono" style="letter-spacing:-0.05em;">${companyEntries.length}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem;">
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <span class="label-caps" style="color:var(--outline);">Por Pais</span>
            <span class="material-symbols-outlined" style="color:var(--outline);">public</span>
          </div>
          ${countryEntries.length === 0
            ? '<p class="mono" style="color:var(--outline);font-size:12px;">Sin datos</p>'
            : countryEntries.map(([country, count]) => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--white-05);">
                <span class="mono" style="font-size:12px;">${country}</span>
                <span class="mono" style="font-size:12px;color:var(--nothing-red);">${count}</span>
              </div>
            `).join('')
          }
        </div>
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <span class="label-caps" style="color:var(--outline);">Por Empresa</span>
            <span class="material-symbols-outlined" style="color:var(--outline);">business</span>
          </div>
          ${companyEntries.length === 0
            ? '<p class="mono" style="color:var(--outline);font-size:12px;">Sin datos</p>'
            : companyEntries.map(([company, count]) => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--white-05);">
                <span class="mono" style="font-size:12px;">${company}</span>
                <span class="mono" style="font-size:12px;color:var(--nothing-red);">${count}</span>
              </div>
            `).join('')
          }
        </div>
      </div>

      <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <span class="label-caps" style="color:var(--outline);">Reportes Recientes</span>
          <span class="material-symbols-outlined" style="color:var(--outline);">list</span>
        </div>
        ${list.length === 0
          ? '<p class="mono" style="color:var(--outline);font-size:12px;">Sin reportes</p>'
          : list.slice(0, 20).map(r => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid var(--white-05);cursor:pointer;" onclick="navigate('/report/${r.id}')">
              <div style="display:flex;align-items:center;gap:0.75rem;min-width:0;flex:1;">
                <span style="width:6px;height:6px;border-radius:50%;background:var(--nothing-red);flex-shrink:0;"></span>
                <div style="min-width:0;">
                  <p class="mono" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(r.description || '').slice(0, 60)}${(r.description || '').length > 60 ? '...' : ''}</p>
                  <p class="mono" style="font-size:9px;color:var(--outline);">${r.company_name || '?'} · ${r.country || '?'} · ${(r.created_at || '').slice(0, 10)}</p>
                </div>
              </div>
              <span class="mono" style="font-size:10px;color:var(--outline);flex-shrink:0;">${(r.id || '').slice(0, 8)}</span>
            </div>
          `).join('')
        }
      </div>

      <footer style="display:flex;justify-content:space-between;padding:1rem 0;margin-top:2rem;border-top:1px solid var(--white-05);opacity:0.4;font-size:12px;">
        <span class="mono">&copy; 2026 QuantMark</span>
        <span class="mono" style="color:var(--outline);">${new Date().toISOString().slice(0,10)}</span>
      </footer>
    </div>`;
  } catch (err) {
    outlet.innerHTML = `<div class="container-padding"><p class="mono" style="color:var(--nothing-red);">Error: ${err.message}</p></div>`;
  }
});