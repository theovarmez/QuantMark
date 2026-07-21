route('/report/:id', async (hash) => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = '<div class="container-padding"><p class="mono">Loading report...</p></div>';

  const id = (hash || '').replace('/report/', '').split('?')[0];
  if (!id) { navigate('/reports'); return; }

  try {
    const r = await api.getReport(id);
    outlet.innerHTML = `
    <div class="container-padding fade-in">
      <div style="margin-bottom:1.5rem;">
        <a href="javascript:history.back()" class="btn btn-ghost" style="padding:0.4rem 0.8rem;font-size:11px;margin-bottom:1rem;display:inline-flex;align-items:center;gap:0.4rem;">
          <span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> VOLVER
        </a>
        <h1 class="headline-lg">Reporte de Leak</h1>
        <p class="mono" style="color:var(--outline);font-size:12px;">${r.id}</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem;">
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 2;">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--nothing-red);display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined" style="color:white;font-size:24px;">warning</span>
            </div>
            <div>
              <p class="mono" style="font-size:15px;">${r.company_name || 'Empresa desconocida'}</p>
              <p class="mono" style="font-size:11px;color:var(--outline);">Empresa afectada</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div>
              <span class="label-caps" style="font-size:9px;color:var(--outline);">Pais</span>
              <p class="mono" style="font-size:13px;">${r.country || '—'}</p>
            </div>
            <div>
              <span class="label-caps" style="font-size:9px;color:var(--outline);">Provincia</span>
              <p class="mono" style="font-size:13px;">${r.province || '—'}</p>
            </div>
            <div>
              <span class="label-caps" style="font-size:9px;color:var(--outline);">Serial Code</span>
              <p class="mono" style="font-size:13px;color:var(--nothing-red);">${r.serial_code || '—'}</p>
            </div>
            <div>
              <span class="label-caps" style="font-size:9px;color:var(--outline);">Fecha</span>
              <p class="mono" style="font-size:13px;">${new Date(r.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 2;">
          <span class="label-caps" style="font-size:9px;color:var(--outline);margin-bottom:0.5rem;display:block;">Descripcion</span>
          <p class="mono" style="font-size:12px;line-height:1.6;color:rgba(255,255,255,0.8);">${r.description}</p>
        </div>

        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);">
          <span class="label-caps" style="font-size:9px;color:var(--outline);margin-bottom:0.5rem;display:block;">Evidence Hash</span>
          <p class="mono" style="font-size:11px;word-break:break-all;color:var(--nothing-red);">${r.evidence_hash}</p>
        </div>

        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);display:flex;flex-direction:column;justify-content:center;">
          <span class="label-caps" style="font-size:9px;color:var(--outline);margin-bottom:0.5rem;display:block;">Certificado</span>
          ${r.certificate_url
            ? `<a href="${r.certificate_url}" target="_blank" class="btn btn-primary" style="justify-content:center;color:black;">
                <span class="material-symbols-outlined">download</span> DESCARGAR PDF
              </a>`
            : '<p class="mono" style="font-size:12px;color:var(--outline);">No disponible</p>'
          }
        </div>
      </div>

      <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);grid-column:span 2;">
        <div style="text-align:center;margin-bottom:1rem;">
          <span class="label-caps" style="font-size:9px;color:var(--outline);">Ubicacion del Leak</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:1rem;padding:1rem 0;">
          <img src="img/location-pin.png" alt="Pin" style="width:48px;height:48px;object-fit:contain;flex-shrink:0;">
          <div style="text-align:left;">
            <p class="mono" style="font-size:16px;color:rgba(255,255,255,0.9);">${r.country || '—'}${r.province ? ', ' + r.province : ''}</p>
            <p class="mono" style="font-size:11px;color:var(--outline);">${r.company_name || 'Empresa desconocida'}</p>
          </div>
        </div>
        <a href="#/search" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem;color:black;">
          <span class="material-symbols-outlined">public</span> ABRIR EN GLOBO
        </a>
      </div>

      <footer style="display:flex;justify-content:space-between;padding:1rem 0;margin-top:2rem;border-top:1px solid var(--white-05);opacity:0.4;font-size:12px;">
        <span class="mono">&copy; 2026 QuantMark</span>
      </footer>
    </div>`;
  } catch (err) {
    outlet.innerHTML = `<div class="container-padding"><p class="mono" style="color:var(--nothing-red);">Error: ${err.message}</p></div>`;
  }
});