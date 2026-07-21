route('/reports', async (hash) => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = '<div class="container-padding"><p class="mono">Loading reports...</p></div>';

  const params = new URLSearchParams((hash || '').split('?')[1] || '');
  const focusId = params.get('id');
  if (focusId) { navigate('/report/' + focusId); return; }

  try {
    const reports = await api.getReports();
    outlet.innerHTML = `
    <div class="container-padding fade-in">
      <div style="margin-bottom:2rem;">
        <h1 class="headline-lg">Reports</h1>
        <p class="mono" style="color:var(--outline);font-size:14px;">Detecciones reportadas — ${reports.length} total</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${reports.length === 0
          ? `<div class="glass" style="border-radius:1rem;padding:3rem;text-align:center;">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);">analytics</span>
              <p class="mono" style="color:var(--outline);margin-top:1rem;">No reports yet.</p>
            </div>`
          : reports.map(r => `
            <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);cursor:pointer;" onclick="navigate('/report/${r.id}')">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div style="display:flex;align-items:center;gap:1rem;">
                  <div style="width:40px;height:40px;border-radius:50%;background:var(--nothing-red);display:flex;align-items:center;justify-content:center;">
                    <span class="material-symbols-outlined" style="color:white;">warning</span>
                  </div>
                  <div>
                    <p class="mono" style="font-size:13px;">${(r.description||'').slice(0, 80)}${(r.description||'').length > 80 ? '...' : ''}</p>
                    <p class="mono" style="font-size:10px;color:var(--outline);">${r.company_name || '?'} · ${r.country || '?'} · ${new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:1rem;">
                  <span class="mono" style="font-size:10px;color:var(--outline);">${r.serial_code || ''}</span>
                  ${r.certificate_url ? `<a href="${r.certificate_url}" target="_blank" class="btn btn-ghost" style="padding:0.375rem 0.75rem;font-size:9px;" onclick="event.stopPropagation()">PDF</a>` : ''}
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>

      <footer style="display:flex;justify-content:space-between;padding:1rem 0;margin-top:2rem;border-top:1px solid var(--white-05);opacity:0.4;font-size:12px;">
        <span class="mono">&copy; 2026 QuantMark</span>
      </footer>
    </div>`;
  } catch (err) {
    outlet.innerHTML = `<div class="container-padding"><p class="mono" style="color:var(--nothing-red);">Error: ${err.message}</p></div>`;
  }
});
