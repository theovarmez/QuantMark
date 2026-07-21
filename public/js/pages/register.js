route('/register', async () => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = `
  <main class="container-padding" style="max-width:560px;margin:4rem auto;">
    <div style="text-align:center;margin-bottom:3rem;">
      <h1 class="headline-md">Registro Gratuito</h1>
      <p class="mono" style="color:var(--outline);font-size:14px;">Tu empresa obtendrá una API Key única</p>
    </div>
    <div class="glass fade-in" style="border-radius:2rem;padding:2.5rem;">
      <form id="register-form" style="display:flex;flex-direction:column;gap:1.5rem;">
        <div>
          <label class="label-caps" style="color:var(--on-surface-variant);display:block;margin-bottom:0.5rem;">Nombre de la empresa</label>
          <input class="input" id="reg-name" placeholder="Ej: Trading Fintech SA" required />
        </div>
        <div>
          <label class="label-caps" style="color:var(--on-surface-variant);display:block;margin-bottom:0.5rem;">Email corporativo</label>
          <input class="input" id="reg-email" type="email" placeholder="team@tufintech.com" required />
        </div>
        <div style="display:flex;gap:1rem;">
          <div style="flex:1;">
            <label class="label-caps" style="color:var(--on-surface-variant);display:block;margin-bottom:0.5rem;">País</label>
            <input class="input" id="reg-country" list="countries" placeholder="Ej: España" />
            <datalist id="countries">
              <option value="Argentina"><option value="Bolivia"><option value="Brasil"><option value="Chile"><option value="Colombia"><option value="Costa Rica"><option value="Cuba"><option value="Ecuador"><option value="El Salvador"><option value="España"><option value="Estados Unidos"><option value="Guatemala"><option value="Honduras"><option value="México"><option value="Nicaragua"><option value="Panamá"><option value="Paraguay"><option value="Perú"><option value="Portugal"><option value="Puerto Rico"><option value="República Dominicana"><option value="Uruguay"><option value="Venezuela"><option value="Otro">
            </datalist>
          </div>
          <div style="flex:1;">
            <label class="label-caps" style="color:var(--on-surface-variant);display:block;margin-bottom:0.5rem;">Provincia / Estado</label>
            <input class="input" id="reg-province" placeholder="Ej: Madrid" />
          </div>
        </div>
        <button type="submit" class="btn btn-red" style="width:100%;justify-content:center;padding:1rem;">
          <span>CREAR CUENTA</span>
        </button>
      </form>
      <div id="reg-result" style="display:none;margin-top:1.5rem;"></div>
      <p style="text-align:center;margin-top:1.5rem;font-size:14px;color:var(--outline);">
        ¿Ya tienes API Key? <a href="#/login" style="color:var(--primary);">Inicia sesión</a>
      </p>
    </div>
  </main>`;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const country = document.getElementById('reg-country').value;
    const province = document.getElementById('reg-province').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin" style="font-size:18px;">sync</span> CREANDO...';

    try {
      const data = await api.register(name, email, country, province);
      setCompany(data.company, data.api_key);
      document.getElementById('reg-result').style.display = 'block';
      document.getElementById('reg-result').innerHTML = `
        <div class="glass" style="border-radius:1rem;padding:1.5rem;border-color:var(--primary);">
          <p class="label-caps" style="color:var(--primary);margin-bottom:1rem;">¡Cuenta creada!</p>
          <p class="mono" style="font-size:12px;color:var(--outline);margin-bottom:0.5rem;">Tu API Key (guárdala, no se mostrará de nuevo):</p>
          <div style="background:var(--pure-black);border-radius:9999px;padding:0.75rem 1.25rem;border:1px solid var(--border-subtle);display:flex;align-items:center;gap:0.5rem;">
            <code class="mono" id="api-key-display" style="font-size:13px;word-break:break-all;flex:1;color:var(--on-surface);">${'*'.repeat(40)}</code>
            <button class="btn" style="padding:0.25rem 0.75rem;font-size:12px;border-radius:9999px;background:var(--surface);border:1px solid var(--border-subtle);cursor:pointer;" title="Revelar" onclick="(function(){var e=document.getElementById('api-key-display');if(e.dataset.r==='1'){e.textContent='${'*'.repeat(40)}';e.dataset.r='0';this.textContent='👁'}else{e.textContent='${data.api_key}';e.dataset.r='1';this.textContent='👁'}})()">👁</button>
            <button onclick="navigator.clipboard.writeText('${data.api_key}');toast('API Key copiada')" class="btn" style="padding:0.25rem 0.75rem;font-size:12px;border-radius:9999px;background:var(--surface);border:1px solid var(--border-subtle);cursor:pointer;" title="Copiar">📋</button>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1rem;" onclick="navigate('/dashboard')">
            IR AL DASHBOARD
          </button>
        </div>
      `;
      toast('Registro exitoso');
    } catch (err) {
      document.getElementById('reg-result').style.display = 'block';
      document.getElementById('reg-result').innerHTML = `
        <p class="mono" style="color:var(--nothing-red);text-align:center;">${err.message}</p>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>CREAR CUENTA</span>';
    }
  });
});
