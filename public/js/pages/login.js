route('/login', async () => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = `
  <main class="container-padding" style="max-width:480px;margin:4rem auto;">
    <div style="text-align:center;margin-bottom:3rem;">
      <h1 class="headline-md">Acceder</h1>
      <p class="mono" style="color:var(--outline);font-size:14px;">Ingresa tu API Key de QuantMark</p>
    </div>
    <div class="glass fade-in" style="border-radius:2rem;padding:2.5rem;">
      <form id="login-form" style="display:flex;flex-direction:column;gap:1.5rem;">
        <div>
          <label class="label-caps" style="color:var(--on-surface-variant);display:block;margin-bottom:0.5rem;">API Key</label>
          <div style="position:relative;">
            <input class="input" id="login-key" type="password" placeholder="qm_..." required style="padding-right:3rem;" />
            <button type="button" id="toggle-login-key" class="btn" style="position:absolute;right:0.5rem;top:50%;transform:translateY(-50%);padding:0.25rem 0.5rem;font-size:14px;border-radius:9999px;background:transparent;border:none;cursor:pointer;color:var(--outline);" title="Mostrar/ocultar">👁</button>
          </div>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:1rem;color:black;">
          <span>VERIFICAR</span>
        </button>
      </form>
      <div id="login-error" style="display:none;margin-top:1rem;"></div>
      <p style="text-align:center;margin-top:1.5rem;font-size:14px;color:var(--outline);">
        ¿No tienes cuenta? <a href="#/register" style="color:var(--primary);">Regístrate gratis</a>
      </p>
    </div>
  </main>`;

  document.getElementById('toggle-login-key').addEventListener('click', () => {
    const input = document.getElementById('login-key');
    if (input.type === 'password') {
      input.type = 'text';
      document.getElementById('toggle-login-key').textContent = '👁';
    } else {
      input.type = 'password';
      document.getElementById('toggle-login-key').textContent = '👁';
    }
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('login-key').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined spin" style="font-size:18px;">sync</span> VERIFICANDO...';

    try {
      // Store key temporarily and test with a models call
      localStorage.setItem('qm_api_key', key);
      const models = await api.getModels();
      // If successful, store a placeholder company
      localStorage.setItem('qm_company', JSON.stringify({ name: 'Mi Empresa', email: '' }));
      toast('API Key verificada');
      navigate('/dashboard');
    } catch (err) {
      localStorage.removeItem('qm_api_key');
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('login-error').innerHTML =
        `<p class="mono" style="color:var(--nothing-red);text-align:center;">${err.message}</p>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>VERIFICAR</span>';
    }
  });
});
