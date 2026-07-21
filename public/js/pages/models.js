route('/models', async () => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = '<div class="container-padding"><p class="mono">Loading models...</p></div>';

  try {
    const models = await api.getModels();
    outlet.innerHTML = `
    <div class="container-padding fade-in">
      <!-- Stats + New Model -->
      <div style="display:grid;grid-template-columns:1fr auto;gap:1rem;margin-bottom:1.5rem;">
        <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <span class="label-caps" style="color:var(--outline);">SYSTEM OVERVIEW</span>
            <div style="display:flex;align-items:baseline;gap:0.5rem;margin-top:0.5rem;">
              <span class="headline-lg mono">${models.length}</span>
              <span class="label-caps" style="color:var(--nothing-red);">MODELS</span>
            </div>
          </div>
          <div style="width:120px;">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--outline);margin-bottom:4px;">
              <span>UTILIZATION</span>
              <span>${models.length > 0 ? Math.min(100, models.length * 8).toFixed(1) : 0}%</span>
            </div>
            <div style="width:100%;height:4px;background:var(--white-05);border-radius:4px;overflow:hidden;">
              <div style="width:${models.length > 0 ? Math.min(100, models.length * 8) : 0}%;height:100%;background:var(--nothing-red);border-radius:4px;"></div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" style="color:black;border-radius:1rem;padding:1rem 2rem;" onclick="showCreateModel()">
          <span class="material-symbols-outlined">add</span> NEW MODEL
        </button>
      </div>

      <!-- Models List -->
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${models.length === 0
          ? `<div class="glass" style="border-radius:1rem;padding:3rem;text-align:center;">
              <span class="material-symbols-outlined" style="font-size:3rem;color:var(--outline);">memory</span>
              <p class="mono" style="color:var(--outline);margin-top:1rem;">No models yet. Create your first one.</p>
            </div>`
          : models.map(m => `
            <div class="glass" style="border-radius:1rem;padding:var(--inner-padding);">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div style="display:flex;align-items:center;gap:1rem;">
                  <div style="width:48px;height:48px;background:var(--white-05);border:1px solid var(--border-subtle);border-radius:0.75rem;display:flex;align-items:center;justify-content:center;">
                    <span class="material-symbols-outlined">memory</span>
                  </div>
                  <div>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                      <h3 class="headline-sm" style="font-size:1.125rem;">${m.name}</h3>
                      <span class="dot dot-active"></span>
                    </div>
                    <p class="mono" style="font-size:12px;color:var(--outline);">${m.description || '—'}</p>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:2rem;">
                  <div style="text-align:right;">
                    <p class="label-caps" style="font-size:9px;color:var(--outline);">CREATED</p>
                    <p class="mono" style="font-size:12px;">${new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                  <button class="btn btn-ghost" style="padding:0.5rem 1rem;" onclick="navigate('/ids?model=${m.id}')">
                    <span class="material-symbols-outlined" style="font-size:1.25rem;">fingerprint</span> IDs
                  </button>
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>

      <!-- Create Model Modal -->
      <div id="create-model-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);align-items:center;justify-content:center;">
        <div class="glass" style="border-radius:2rem;padding:2rem;max-width:480px;width:90%;margin:2rem auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
            <h2 class="headline-sm">New Model</h2>
            <span class="material-symbols-outlined" style="cursor:pointer;color:var(--outline);" onclick="closeCreateModel()">close</span>
          </div>
          <form id="create-model-form" style="display:flex;flex-direction:column;gap:1rem;">
            <input class="input" id="model-name" placeholder="Model name" required />
            <input class="input" id="model-desc" placeholder="Description (optional)" />
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;color:black;">CREATE</button>
          </form>
        </div>
      </div>

      <footer style="display:flex;justify-content:space-between;padding:1rem 0;margin-top:2rem;border-top:1px solid var(--white-05);opacity:0.4;font-size:12px;">
        <span class="mono">&copy; 2026 QuantMark</span>
      </footer>
    </div>`;

    window.showCreateModel = () => {
      document.getElementById('create-model-modal').style.display = 'flex';
    };
    window.closeCreateModel = () => {
      document.getElementById('create-model-modal').style.display = 'none';
    };

    document.getElementById('create-model-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('model-name').value;
      const desc = document.getElementById('model-desc').value;
      await api.createModel(name, desc || null);
      toast('Model created');
      closeCreateModel();
      navigate('/models');
    });
  } catch (err) {
    outlet.innerHTML = `<div class="container-padding"><p class="mono" style="color:var(--nothing-red);">Error: ${err.message}</p></div>`;
  }
});
