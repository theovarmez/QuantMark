route('/ids', async (hash) => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = '<div class="container-padding"><p class="mono">Loading IDs...</p></div>';

  try {
    const params = hash.includes('?') ? hash.split('?')[1] : '';
    const ids = await api.getIds(params ? `?${params}` : '');
    const models = await api.getModels();

    outlet.innerHTML = `
    <div class="container-padding fade-in">
      <!-- Title + Generate -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2rem;">
        <div>
          <h1 class="headline-lg" style="margin:0;">Registry</h1>
          <p class="mono" style="color:var(--outline);font-size:14px;margin-top:0.5rem;">Watermark IDs — ${ids.length} total</p>
        </div>
        <button class="btn btn-primary" style="color:black;" onclick="showGenerateId()">
          <span class="material-symbols-outlined" style="font-size:18px;">add</span> GENERATE ID
        </button>
      </div>

      <div class="bento-grid">
        <!-- ID Table -->
        <div class="glass" style="border-radius:2rem;padding:var(--inner-padding);grid-column:span 8;display:flex;flex-direction:column;max-height:600px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <span class="label-caps" style="color:var(--outline);">MASTER ID LIST</span>
            <div style="display:flex;align-items:center;gap:0.5rem;background:var(--white-05);border-radius:9999px;padding:0.25rem 0.75rem;border:1px solid var(--border-subtle);">
              <span class="material-symbols-outlined" style="font-size:16px;opacity:0.4;">search</span>
              <input class="input" style="border:none;padding:0.25rem 0.5rem;font-size:12px;" placeholder="SEARCH..." />
            </div>
          </div>
          <div style="overflow-y:auto;flex:1;">
            <table class="table-widget">
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Model</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${ids.length === 0
                  ? `<tr><td colspan="5" style="text-align:center;padding:3rem;color:var(--outline);">No watermark IDs yet</td></tr>`
                  : ids.map(wm => {
                      const model = models.find(m => m.id === wm.model_id);
                      return `<tr onclick="selectId('${wm.id}')">
                        <td><span class="mono" style="color:var(--primary);font-size:13px;">${wm.serial_code}</span></td>
                        <td style="font-size:13px;">${model ? model.name : '—'}</td>
                        <td style="font-size:12px;color:var(--outline);">${new Date(wm.created_at).toLocaleDateString()}</td>
                        <td>
                          <span class="badge ${wm.status === 'active' ? 'badge-active' : 'badge-revoked'}" style="font-size:9px;">
                            <span class="dot ${wm.status === 'active' ? 'dot-active' : 'dot-revoked'}" style="width:6px;height:6px;"></span>
                            ${wm.status.toUpperCase()}
                          </span>
                        </td>
                        <td style="text-align:right;">
                          <span class="material-symbols-outlined" style="font-size:1.25rem;opacity:0.4;color:var(--outline);">more_horiz</span>
                        </td>
                      </tr>`;
                    }).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Detail Panel -->
        <div class="glass" style="border-radius:2rem;padding:var(--inner-padding);grid-column:span 4;display:flex;flex-direction:column;max-height:600px;overflow:hidden;">
          <div id="detail-content" style="display:flex;flex-direction:column;height:100%;">
            <span class="label-caps" style="color:var(--outline);margin-bottom:1rem;">SELECTED ID DETAIL</span>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--outline);">
              <span class="material-symbols-outlined" style="font-size:3rem;">touch_app</span>
              <p class="mono" style="font-size:12px;margin-top:1rem;">Selecciona un ID para ver detalles</p>
            </div>
          </div>
        </div>

        <!-- Mini widgets -->
        <div class="glass" style="border-radius:2rem;padding:var(--inner-padding);grid-column:span 3;display:flex;flex-direction:column;justify-content:space-between;">
          <span class="material-symbols-outlined" style="font-size:2rem;">hub</span>
          <div>
            <div class="headline-sm mono">${ids.length}</div>
            <div class="label-caps" style="color:var(--outline);">TOTAL IDS</div>
          </div>
        </div>
        <div class="glass" style="border-radius:2rem;padding:var(--inner-padding);grid-column:span 3;display:flex;flex-direction:column;justify-content:space-between;">
          <span class="material-symbols-outlined" style="font-size:2rem;color:var(--nothing-red);">warning</span>
          <div>
            <div class="headline-sm mono">${ids.filter(i => i.status === 'revoked').length > 0 ? ((ids.filter(i => i.status === 'revoked').length / ids.length) * 100).toFixed(1) : '0'}%</div>
            <div class="label-caps" style="color:var(--outline);">REVOCATION RATE</div>
          </div>
        </div>
      </div>

      <!-- Generate ID Modal -->
      <div id="generate-id-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);align-items:center;justify-content:center;">
        <div class="glass" style="border-radius:2rem;padding:2rem;max-width:480px;width:90%;margin:2rem auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
            <h2 class="headline-sm">Generate Watermark ID</h2>
            <span class="material-symbols-outlined" style="cursor:pointer;color:var(--outline);" onclick="closeGenerateId()">close</span>
          </div>
          <form id="generate-id-form" style="display:flex;flex-direction:column;gap:1rem;">
            <select class="input" id="gen-model" required>
              <option value="">Select model...</option>
              ${models.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;color:black;">GENERATE</button>
          </form>
        </div>
      </div>

      <!-- Revoke Modal -->
      <div id="revoke-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);align-items:center;justify-content:center;">
        <div class="glass" style="border-radius:2rem;padding:2rem;max-width:400px;width:90%;margin:2rem auto;text-align:center;">
          <h2 class="headline-sm" style="color:var(--nothing-red);margin-bottom:1rem;">Revoke ID</h2>
          <p class="mono" style="color:var(--outline);font-size:14px;margin-bottom:1.5rem;">This action cannot be undone.</p>
          <div style="display:flex;gap:1rem;justify-content:center;">
            <button class="btn btn-ghost" onclick="closeRevoke()">CANCEL</button>
            <button class="btn btn-red" id="confirm-revoke">REVOKE</button>
          </div>
        </div>
      </div>
    </div>`;

    // Generate ID
    window.showGenerateId = () => document.getElementById('generate-id-modal').style.display = 'flex';
    window.closeGenerateId = () => document.getElementById('generate-id-modal').style.display = 'none';

    document.getElementById('generate-id-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const modelId = document.getElementById('gen-model').value;
      await api.createId(modelId);
      toast('Watermark ID generated');
      closeGenerateId();
      navigate('/ids');
    });

    // Select ID for detail
    window.selectedId = null;
    window.revokeTarget = null;

    window.selectId = async (id) => {
      window.selectedId = id;
      const wm = await api.getId(id);
      const model = models.find(m => m.id === wm.model_id);
      const movements = await api.getMovements(id);
      const detailEl = document.getElementById('detail-content');

      detailEl.innerHTML = `
        <span class="label-caps" style="color:var(--outline);margin-bottom:1rem;">SELECTED ID DETAIL</span>
        <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:1.5rem;">
          <div style="width:80px;height:80px;border-radius:50%;border:3px solid ${wm.status === 'active' ? 'var(--primary)' : 'var(--nothing-red)'};display:flex;align-items:center;justify-content:center;margin-bottom:1rem;">
            <span class="material-symbols-outlined" style="font-size:2.5rem;color:${wm.status === 'active' ? 'var(--primary)' : 'var(--nothing-red)'};">verified</span>
          </div>
          <h2 class="headline-sm mono" style="font-size:1.25rem;">${wm.serial_code}</h2>
          <p class="mono" style="font-size:10px;color:var(--outline);">SHA-256</p>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <h4 class="label-caps" style="font-size:10px;color:var(--outline);margin-bottom:1rem;">TIMELINE</h4>
          ${movements.length === 0
            ? '<p class="mono" style="color:var(--outline);font-size:11px;">No movements</p>'
            : `<div style="position:relative;padding-left:1.5rem;">
                <div style="position:absolute;left:11px;top:8px;bottom:8px;width:1px;background:var(--white-10);"></div>
                ${movements.slice(0, 10).map(m => `
                  <div style="position:relative;display:flex;gap:0.75rem;margin-bottom:1rem;">
                    <div style="width:24px;height:24px;border-radius:50%;background:var(--white-10);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;z-index:1;flex-shrink:0;">
                      <span style="width:6px;height:6px;background:var(--outline);border-radius:50%;display:block;"></span>
                    </div>
                    <div>
                      <p class="mono" style="font-size:11px;color:var(--primary);">${m.event_type.toUpperCase()}</p>
                      <p class="mono" style="font-size:9px;color:var(--outline);">${new Date(m.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                `).join('')}
              </div>`
          }
        </div>
        ${wm.status === 'active'
          ? `<button class="btn btn-red" style="width:100%;justify-content:center;margin-top:1rem;" onclick="openRevoke('${wm.id}')">REVOKE ID</button>`
          : `<span class="badge badge-revoked" style="width:100%;justify-content:center;padding:0.75rem;font-size:11px;">REVOKED</span>`
        }
      `;
    };

    // Revoke
    window.openRevoke = (id) => {
      window.revokeTarget = id;
      document.getElementById('revoke-modal').style.display = 'flex';
    };
    window.closeRevoke = () => {
      document.getElementById('revoke-modal').style.display = 'none';
    };

    document.getElementById('confirm-revoke')?.addEventListener('click', async () => {
      if (window.revokeTarget) {
        await api.revokeId(window.revokeTarget);
        toast('ID revoked');
        closeRevoke();
        navigate('/ids');
      }
    });
  } catch (err) {
    outlet.innerHTML = `<div class="container-padding"><p class="mono" style="color:var(--nothing-red);">Error: ${err.message}</p></div>`;
  }
});
