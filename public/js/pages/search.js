route('/search', async () => {
  const outlet = document.getElementById('app-outlet');
  outlet.innerHTML = `
  <div style="position:relative;min-height:100vh;overflow:hidden;">
    <div id="globe-container" style="position:fixed;inset:0;z-index:0;pointer-events:auto;background:#000;"></div>

    <!-- Tooltip -->
    <div id="tooltip" style="position:fixed;background:rgba(10,10,10,0.8);backdrop-filter:blur(10px);padding:6px 14px;border-radius:8px;font-size:13px;pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:999;border:1px solid rgba(255,255,255,0.1);color:#fff;font-family:'Space Mono',monospace;"></div>

    <!-- Info Card -->
    <div id="info-card" style="position:fixed;bottom:-100%;left:50%;transform:translateX(-50%);width:90%;max-width:450px;background:rgba(10,10,10,0.85);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;transition:bottom 0.5s cubic-bezier(0.16,1,0.3,1);z-index:1000;max-height:70vh;overflow-y:auto;display:none;">
      <div style="width:40px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin:0 auto 16px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h2 id="country-name" style="font-size:22px;font-weight:600;color:#fff;font-family:'Space Mono',monospace;"></h2>
        <button onclick="window._closeInfoCard()" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div id="info-content" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;"></div>
    </div>

    <!-- Overlay UI -->
    <div style="position:relative;z-index:10;display:flex;flex-direction:column;min-height:100vh;pointer-events:none;">
      <header style="display:flex;align-items:center;gap:1rem;padding:0.75rem 1.5rem;background:rgba(0,0,0,0.6);backdrop-filter:blur(12px);border-bottom:1px solid var(--border-subtle);pointer-events:auto;">
        <a href="/" style="text-decoration:none;display:flex;align-items:center;gap:0.5rem;">
          <img src="LOGO_MINI.png" alt="QuantMark" style="height:28px;width:auto;">
        </a>
        <div style="margin-left:auto;">
          <a href="#/" class="btn btn-ghost" style="padding:0.5rem 1rem;font-size:12px;"><span>CERRAR</span></a>
        </div>
      </header>
      <section style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;pointer-events:none;">
        <div style="max-width:560px;width:100%;pointer-events:auto;">
          <div style="position:relative;display:inline-block;margin-bottom:1.5rem;">
            <h1 class="headline-lg dot-matrix" style="font-size:clamp(2.5rem,8vw,80px);user-select:none;line-height:1;">QuantMark</h1>
            <span style="position:absolute;right:-1rem;top:0;width:1rem;height:1rem;background:var(--nothing-red);border-radius:50%;animation:ping 2s infinite;box-shadow:0 0 15px rgba(255,0,49,0.8);"></span>
          </div>
          <div style="position:relative;">
            <span class="material-symbols-outlined" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#aaaaaa;font-size:1.5rem;text-shadow:0 0 12px rgba(0,0,0,0.9);">search</span>
            <input id="global-search" class="input" type="text" placeholder="Buscar empresa, serial code o reporte..." style="padding:1rem 1rem 1rem 3.5rem;border-radius:9999px;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);border:2px solid rgba(255,255,255,0.15);width:100%;font-size:16px;box-shadow:0 0 40px rgba(0,0,0,0.6);">
            <div id="search-results" style="position:absolute;top:calc(100% + 6px);left:0;right:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);border:1px solid var(--border-subtle);border-radius:1rem;display:none;max-height:360px;overflow-y:auto;z-index:50;text-align:left;"></div>
          </div>
          <div id="quick-suggestions" style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
            <button class="btn" style="padding:0.4rem 1rem;font-size:11px;border-radius:9999px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);color:#cccccc;pointer-events:auto;" onclick="document.getElementById('global-search').value='QM-';document.getElementById('global-search').dispatchEvent(new Event('input'))">QM-...</button>
            <button class="btn" style="padding:0.4rem 1rem;font-size:11px;border-radius:9999px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);color:#cccccc;pointer-events:auto;" onclick="showCategory('reports')">reportes</button>
            <button class="btn" style="padding:0.4rem 1rem;font-size:11px;border-radius:9999px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);color:#cccccc;pointer-events:auto;" onclick="showCategory('active')">activos</button>
            <button class="btn" style="padding:0.4rem 1rem;font-size:11px;border-radius:9999px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);color:#cccccc;pointer-events:auto;" onclick="showCategory('safe')">seguro</button>
            <button class="btn" style="padding:0.4rem 1rem;font-size:11px;border-radius:9999px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);color:#cccccc;pointer-events:auto;" onclick="showCategory('models')">modelos</button>
          </div>
        </div>
      </section>
      <div style="display:flex;gap:1.5rem;justify-content:center;padding:1.5rem 2rem;background:rgba(0,0,0,0.4);backdrop-filter:blur(8px);border-top:1px solid var(--border-subtle);pointer-events:auto;">
        <div style="text-align:center;">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;margin:0 auto 0.4rem;">
            <span class="mono" id="stat-models" style="font-size:1.1rem;color:#dddddd;">--</span>
          </div>
          <span class="label-caps" style="display:block;color:rgba(255,255,255,0.4);font-size:8px;">MODELOS</span>
        </div>
        <div style="text-align:center;">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;margin:0 auto 0.4rem;">
            <span class="mono" id="stat-ids" style="font-size:1.1rem;color:#dddddd;">--</span>
          </div>
          <span class="label-caps" style="display:block;color:rgba(255,255,255,0.4);font-size:8px;">WATERMARKS</span>
        </div>
        <div style="text-align:center;">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,0,49,0.08);border:1px solid rgba(255,0,49,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 0.4rem;">
            <span class="mono" id="stat-reports" style="font-size:1.1rem;color:#ff3344;">--</span>
          </div>
          <span class="label-caps" style="display:block;color:rgba(255,0,49,0.5);font-size:8px;">REPORTES</span>
        </div>
        <div style="text-align:center;">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 0.4rem;">
            <span class="mono" id="stat-safe" style="font-size:1.1rem;color:#44ff99;">--</span>
          </div>
          <span class="label-caps" style="display:block;color:rgba(0,255,136,0.4);font-size:8px;">SEGUROS</span>
        </div>
      </div>
    </div>
  </div>`;

  // ── Load Three.js + OrbitControls ──
  let THREE = null;
  try {
    THREE = await Promise.race([
      new Promise(resolve => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        s.onload = () => resolve(window.THREE);
        s.onerror = () => resolve(null);
        document.head.appendChild(s);
      }),
      new Promise(resolve => setTimeout(() => resolve(null), 8000)),
    ]);
    if (THREE) {
      await new Promise(resolve => {
        const s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
        s2.onload = resolve;
        s2.onerror = resolve;
        document.head.appendChild(s2);
      });
    }
  } catch (_) { THREE = null; }

  // ── Fetch stats / leaks ──
  let allLeakCoords = [];
  let rawReports = [];
  let countryCentroids = {};
  try {
    const [statsRes, reportsRes] = await Promise.all([
      fetch(window.QUANTMARK_API + '/stats').then(r => r.json()).catch(() => ({})),
      fetch(window.QUANTMARK_API + '/reports').then(r => r.json()).catch(() => []),
    ]);
    const stats = (statsRes && typeof statsRes === 'object' && !Array.isArray(statsRes)) ? statsRes : {};
    const reports = Array.isArray(reportsRes) ? reportsRes : [];
    const m = stats.models || 0, i = stats.ids || 0, r = stats.reports || 0;
    document.getElementById('stat-models').textContent = m;
    document.getElementById('stat-ids').textContent = i;
    document.getElementById('stat-reports').textContent = r;
    document.getElementById('stat-safe').textContent = Math.max(0, i - r);
    rawReports = reports;
  } catch (_) {}

  // ── Advanced Globe ──
  if (THREE) {
    const container = document.getElementById('globe-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.3, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(5, 3, 5); scene.add(dl);
    const bl = new THREE.DirectionalLight(0x334466, 0.3); bl.position.set(-5, -3, -5); scene.add(bl);

    // ── Globe ──
    const globeMat = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 5, specular: 0x111111 });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), globeMat);
    scene.add(globe);

    // Atmosphere glow (uniform for leak alert color)
    const atmUniforms = { color: { value: new THREE.Color(0.15, 0.3, 0.5) } };
    const atmMat = new THREE.ShaderMaterial({
      uniforms: atmUniforms,
      vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform vec3 color;varying vec3 vN;void main(){float i=pow(max(0.0,0.65-dot(vN,vec3(0,0,1))),3.0);gl_FragColor=vec4(color,1.0)*i*2.5;}`,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
    });
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 64), atmMat);
    atm.scale.set(1.15, 1.15, 1.15);
    scene.add(atm);

    // ── Stars ──
    const starsGeo = new THREE.BufferGeometry();
    const sv = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 100, y = (Math.random() - 0.5) * 100, z = (Math.random() - 0.5) * 100;
      if (Math.sqrt(x*x+y*y+z*z) > 5) sv.push(x, y, z);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.005, transparent: true, opacity: 0.8 })));

    // ── Helpers ──
    function latLonToVec(lat, lon, r) {
      const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
    }

    // ── Load country outlines ──
    let countriesMeshes = [];
    let hoveredCountry = null;
    window._countryNames = [];
    let countryData = {};

    function computeCentroid(feature) {
      const geo = feature.geometry;
      if (!geo) return null;
      let polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.type === 'MultiPolygon' ? geo.coordinates : [];
      let cx = 0, cy = 0, cz = 0, count = 0;
      polys.forEach(poly => {
        poly.forEach(ring => {
          ring.forEach(c => {
            const p = (90 - c[1]) * Math.PI / 180, t = (c[0] + 180) * Math.PI / 180;
            cx += Math.sin(p) * Math.cos(t); cy += Math.cos(p); cz += Math.sin(p) * Math.sin(t); count++;
          });
        });
      });
      if (!count) return null;
      cx /= count; cy /= count; cz /= count;
      const l = Math.sqrt(cx*cx + cy*cy + cz*cz);
      return { lat: 90 - Math.acos(Math.max(-1, Math.min(1, cy/l))) * 180 / Math.PI, lng: Math.atan2(cz, cx) * 180 / Math.PI - 180 };
    }

    async function loadCountries() {
      try {
        const resp = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
        const data = await resp.json();
        data.features.forEach(f => {
          const name = f.properties.NAME || f.properties.name || f.properties.ADMIN;
          if (!name) return;
          window._countryNames.push(name);
          try { drawCountry(f, name); } catch(e) {}
          const cent = computeCentroid(f);
          if (cent) countryCentroids[name.toLowerCase().trim()] = cent;
        });
        processLeaks();
      } catch(e) {
        console.warn('Failed to load country data, using fallback dots');
        createFallbackGlobe();
        processLeaks();
      }
    }

    function drawCountry(feature, name) {
      const geo = feature.geometry;
      if (!geo) return;
      let polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.type === 'MultiPolygon' ? geo.coordinates : [];
      const group = new THREE.Group();
      group.userData = { name };
      polys.forEach(poly => {
        poly.forEach(ring => {
          if (ring.length < 3) return;
          // Land fill
          try {
            const pts = ring.map(c => latLonToVec(c[1], c[0], 1.001));
            let cx = 0, cy = 0, cz = 0;
            pts.forEach(p => { cx += p.x; cy += p.y; cz += p.z; });
            cx /= pts.length; cy /= pts.length; cz /= pts.length;
            const l = Math.sqrt(cx*cx + cy*cy + cz*cz);
            const verts = [cx/l*1.001, cy/l*1.001, cz/l*1.001];
            pts.forEach(p => verts.push(p.x, p.y, p.z));
            const idx = [];
            for (let i = 1; i < pts.length; i++) idx.push(0, i, i + 1 > pts.length ? 1 : i + 1);
            idx.push(0, pts.length, 1);
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
            g.setIndex(idx);
            g.computeVertexNormals();
            const mMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.95, side: THREE.DoubleSide, shininess: 2 });
            group.add(new THREE.Mesh(g, mMat));
          } catch(e) {}
          // Border outline
          const linePts = ring.map(c => latLonToVec(c[1], c[0], 1.002));
          const lg = new THREE.BufferGeometry().setFromPoints(linePts);
          group.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })));
        });
      });
      scene.add(group);
      countriesMeshes.push(group);
    }

    function createFallbackGlobe() {
      // Simple dot-based globe as fallback
      const dotCount = 6000;
      const pos = new Float32Array(dotCount * 3);
      const col = new Float32Array(dotCount * 3);
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < dotCount; i++) {
        const y = 1 - (i / (dotCount - 1)) * 2;
        const r = Math.sqrt(1 - y * y), theta = phi * i;
        pos[i*3] = Math.cos(theta)*r; pos[i*3+1] = y; pos[i*3+2] = Math.sin(theta)*r;
        col[i*3] = 0.3; col[i*3+1] = 0.3; col[i*3+2] = 0.35;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, sizeAttenuation: true })));
    }

    // ── Satellites ──
    const satCfgs = [
      { r: 1.35, sp: 0.3, inc: 0.5, ph: 0 },
      { r: 1.45, sp: -0.2, inc: 0.8, ph: Math.PI/2 },
      { r: 1.55, sp: 0.25, inc: 0.3, ph: Math.PI },
      { r: 1.4, sp: -0.35, inc: 1.2, ph: Math.PI*1.5 },
    ];
    const satellites = [];
    satCfgs.forEach(cfg => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.008), new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x333333 }));
      g.add(b);
      const pMat = new THREE.MeshPhongMaterial({ color: 0x1144aa, emissive: 0x0a2266 });
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.025, 0.001), pMat); p1.position.x = -0.01; g.add(p1);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.025, 0.001), pMat); p2.position.x = 0.01; g.add(p2);
      const lMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
      const lt = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 8), lMat); lt.position.y = 0.006; g.add(lt);
      scene.add(g);
      // Orbit path
      const pts = [];
      for (let i = 0; i <= 200; i++) {
        const a = (i / 200) * Math.PI * 2;
        pts.push(new THREE.Vector3(cfg.r*Math.cos(a), cfg.r*Math.sin(a)*Math.sin(cfg.inc), cfg.r*Math.sin(a)*Math.cos(cfg.inc)));
      }
      const oG = new THREE.BufferGeometry().setFromPoints(pts);
      const oM = new THREE.LineDashedMaterial({ color: 0x334455, dashSize: 0.03, gapSize: 0.03, transparent: true, opacity: 0.3 });
      const oL = new THREE.Line(oG, oM); oL.computeLineDistances(); scene.add(oL);
      satellites.push({ mesh: g, light: lMat, cfg, angle: cfg.ph });
    });

    // ── Process leaks: place dots at country centroids ──
    let knownReportIds = new Set();
    let leakDotsMesh = null;
    let leakCountries = new Set();

    function getReportCoords(r) {
      const country = (r.country || '').toLowerCase().trim();
      let cent = countryCentroids[country];
      if (!cent) {
        for (const [k, v] of Object.entries(countryCentroids)) {
          if (k.includes(country) || country.includes(k)) { cent = v; break; }
        }
      }
      if (cent) return { lat: cent.lat, lng: cent.lng };
      let hash = 0;
      for (let i = 0; i < (r.id || '').length; i++) hash = ((hash << 5) - hash) + r.id.charCodeAt(i);
      return { lat: (Math.abs(hash) % 180) - 90, lng: (Math.abs(hash * 7) % 360) - 180 };
    }

    function rebuildLeakDots(reports) {
      if (leakDotsMesh) { scene.remove(leakDotsMesh); leakDotsMesh.geometry.dispose(); leakDotsMesh.material.dispose(); leakDotsMesh = null; }
      if (!reports.length) return;
      const lp = [];
      for (const r of reports) {
        const c = getReportCoords(r);
        const lat = c.lat * Math.PI / 180, lng = c.lng * Math.PI / 180;
        lp.push(1.02 * Math.cos(lat) * Math.cos(lng), 1.02 * Math.sin(lat), 1.02 * Math.cos(lat) * Math.sin(lng));
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      leakDotsMesh = new THREE.Points(lg, new THREE.PointsMaterial({ size: 0.07, color: 0xff0031, transparent: true, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
      scene.add(leakDotsMesh);
    }

    function processLeaks() {
      const ids = new Set(rawReports.map(r => r.id));
      knownReportIds = ids;
      leakCountries = new Set(rawReports.map(r => (r.country || '').toLowerCase().trim()).filter(Boolean));
      rebuildLeakDots(rawReports);
    }

    // ── Poll for new reports & trigger alert ──
    async function pollNewReports() {
      try {
        const reports = await fetch(window.QUANTMARK_API + '/reports').then(r => r.json()).catch(() => []);
        const list = Array.isArray(reports) ? reports : [];
        const newOnes = list.filter(r => !knownReportIds.has(r.id));
        if (newOnes.length > 0) {
          knownReportIds = new Set(list.map(r => r.id));
          leakCountries = new Set(list.map(r => (r.country || '').toLowerCase().trim()).filter(Boolean));
          rebuildLeakDots(list);
          newOnes.forEach((r, i) => {
            const c = getReportCoords(r);
            setTimeout(() => triggerLeakAlert(c.lat, c.lng), i * 4000);
          });
        }
      } catch (_) {}
    }

    setInterval(pollNewReports, 10000);

    // ── Raycaster for hover/click ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    // ── Leak alert: red aura + closest satellite laser ──
    let leakLaser = null;
    let leakTimeout = null;

    function triggerLeakAlert(lat, lng) {
      // Skip if already in alert
      if (leakLaser) return;

      // 1. Red aura
      atmUniforms.color.value.setHex(0xff2244);

      // 2. Find closest satellite to leak location
      const leakVec = latLonToVec(lat, lng, 1.002);
      let closest = 0, minDist = Infinity;
      satellites.forEach((s, i) => {
        const d = s.mesh.position.distanceTo(leakVec);
        if (d < minDist) { minDist = d; closest = i; }
      });
      const satPos = satellites[closest].mesh.position.clone();

      // 3. Create laser beam (red line from satellite to leak)
      const laserGeo = new THREE.BufferGeometry().setFromPoints([satPos, leakVec]);
      const laserMat = new THREE.LineBasicMaterial({ color: 0xff0031, transparent: true, opacity: 0.9 });
      leakLaser = new THREE.Line(laserGeo, laserMat);
      scene.add(leakLaser);

      // 4. Revert after 3 seconds
      if (leakTimeout) clearTimeout(leakTimeout);
      leakTimeout = setTimeout(() => {
        atmUniforms.color.value.setHex(0x2266aa);
        if (leakLaser) { scene.remove(leakLaser); leakLaser.geometry.dispose(); leakLaser.material.dispose(); leakLaser = null; }
        leakTimeout = null;
      }, 3000);
    }

    function getSatScreenPos(satIdx) {
      const v = new THREE.Vector3();
      satellites[satIdx].mesh.getWorldPosition(v);
      v.project(camera);
      return { x: (v.x * 0.5 + 0.5) * container.clientWidth, y: (-v.y * 0.5 + 0.5) * container.clientHeight };
    }

    let satBubble = null;
    let satBubbleTimeout = null;

    function showSatBubble(satIdx) {
      if (satBubbleTimeout) clearTimeout(satBubbleTimeout);
      if (!satBubble) {
        satBubble = document.createElement('div');
        satBubble.id = 'sat-bubble';
        satBubble.style.cssText = 'position:fixed;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);padding:10px 16px;border-radius:12px;font-size:12px;pointer-events:none;z-index:998;border:1px solid rgba(255,255,255,0.15);color:#fff;font-family:"Space Mono",monospace;opacity:0;transition:opacity 0.3s;box-shadow:0 0 30px rgba(0,0,0,0.5);max-width:260px;';
        document.body.appendChild(satBubble);
      }
      const pos = getSatScreenPos(satIdx);
      satBubble.innerHTML = '🛰️ Beep Bop!<br><span style="color:#ff3344;font-size:10px;letter-spacing:1px;">Scanning Vulnerabilities...</span>';
      satBubble.style.left = Math.min(pos.x - 100, container.clientWidth - 280) + 'px';
      satBubble.style.top = Math.max(pos.y - 70, 10) + 'px';
      satBubble.style.opacity = '1';
      satBubbleTimeout = setTimeout(() => { if (satBubble) satBubble.style.opacity = '0'; }, 4000);
    }

    function onMouseMove(e) {
      mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
      mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(mouse, camera);
      let found = false;
      for (const group of countriesMeshes) {
        const meshes = group.children.filter(c => c.isMesh);
        const hits = raycaster.intersectObjects(meshes);
        if (hits.length > 0) {
          const name = group.userData.name;
          const tooltip = document.getElementById('tooltip');
          tooltip.textContent = name;
          tooltip.style.left = (e.clientX + 15) + 'px';
          tooltip.style.top = (e.clientY - 10) + 'px';
          tooltip.style.opacity = '1';
          document.body.style.cursor = 'pointer';
          if (hoveredCountry && hoveredCountry !== group && hoveredCountry !== redCountry) resetHighlight(hoveredCountry);
          if (group !== redCountry) highlightCountry(group);
          hoveredCountry = group;
          found = true;
          break;
        }
      }
      if (!found) {
        document.getElementById('tooltip').style.opacity = '0';
        document.body.style.cursor = 'default';
        if (hoveredCountry && hoveredCountry !== redCountry) { resetHighlight(hoveredCountry); hoveredCountry = null; }
      }
    }

    function highlightCountry(g) {
      g.children.forEach(c => {
        if (c.isMesh && c.material) { c.material.color.setHex(0x2a2a2a); c.material.emissive = new THREE.Color(0x0a1520); }
        else if (c.isLine && c.material) { c.material.opacity = 0.8; c.material.color.setHex(0x66aaff); }
      });
    }

    function resetHighlight(g) {
      g.children.forEach(c => {
        if (c.isMesh && c.material) { c.material.color.setHex(0x1a1a1a); c.material.emissive = new THREE.Color(0x000000); }
        else if (c.isLine && c.material) { c.material.opacity = 0.35; c.material.color.setHex(0xffffff); }
      });
    }

    function highlightCountryRed(g) {
      g.children.forEach(c => {
        if (c.isMesh && c.material) { c.material.color.setHex(0x440000); c.material.emissive = new THREE.Color(0xff0031); }
        else if (c.isLine && c.material) { c.material.opacity = 1; c.material.color.setHex(0xff2244); }
      });
    }

    let flyTarget = null;
    let redHighlightTimeout = null;
    let redCountry = null;

    function flyToCountry(lat, lng) {
      const dist = camera.position.distanceTo(controls.target);
      const p = (90 - lat) * Math.PI / 180;
      const t = (lng + 180) * Math.PI / 180;
      flyTarget = new THREE.Vector3(
        -dist * Math.sin(p) * Math.cos(t),
        dist * Math.cos(p),
        dist * Math.sin(p) * Math.sin(t)
      );
      controls.autoRotate = false;
    }

    function onClick() {
      mouse.x = (mouse.x || 0);
      mouse.y = (mouse.y || 0);
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(mouse, camera);
      // Check satellite hit first (easter egg when close)
      const satHits = raycaster.intersectObjects(satellites.map(s => s.mesh), true);
      if (satHits.length > 0 && camera.position.distanceTo(controls.target) < 2.0) {
        let satIdx = -1;
        for (let i = 0; i < satellites.length; i++) {
          if (satellites[i].mesh === satHits[0].object.parent || satellites[i].mesh === satHits[0].object) { satIdx = i; break; }
        }
        showSatBubble(satIdx >= 0 ? satIdx : 0);
        return;
      }
      for (const group of countriesMeshes) {
        const meshes = group.children.filter(c => c.isMesh);
        if (raycaster.intersectObjects(meshes).length > 0) {
          showInfoCard(group.userData.name, group);
          return;
        }
      }
    }

    window._closeInfoCard = () => {
      const card = document.getElementById('info-card');
      card.style.display = 'none';
      card.classList.remove('visible');
      if (redHighlightTimeout) { clearTimeout(redHighlightTimeout); redHighlightTimeout = null; }
      if (redCountry) { resetHighlight(redCountry); redCountry = null; }
    };
    window._showInfoCard = showInfoCard;
    function showInfoCard(name, group) {
      const card = document.getElementById('info-card');
      document.getElementById('country-name').textContent = name;
      const nc = name.toLowerCase().trim();
      const hasLeak = leakCountries.has(nc) || [...leakCountries].some(lc => lc.includes(nc) || nc.includes(lc));
      document.getElementById('info-content').innerHTML = `
        <div class="info-item full-width" style="grid-column:1/-1;background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,0.05);">
          <div class="info-label" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:5px;">País</div>
          <div class="info-value" style="font-size:15px;color:rgba(255,255,255,0.9);font-weight:500;">${name}</div>
        </div>
        <div class="info-item" style="grid-column:1/-1;background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,0.05);">
          <div class="info-label" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);margin-bottom:5px;">Estado</div>
          <div class="info-value" style="font-size:15px;font-weight:500;${hasLeak ? 'color:#ff3344;' : 'color:#00ff88;'}">${hasLeak ? '⚠ Leaks detectados' : '✓ Sin leaks reportados'}</div>
        </div>`;
      card.style.display = 'block';
      card.classList.add('visible');
      card.style.bottom = '20px';

      if (redHighlightTimeout) { clearTimeout(redHighlightTimeout); redHighlightTimeout = null; }
      if (redCountry) resetHighlight(redCountry);

      // Fly to country on globe
      const cent = countryCentroids[nc];
      if (cent) {
        flyToCountry(cent.lat, cent.lng);
        if (group) {
          highlightCountryRed(group);
          redCountry = group;
        } else {
          for (const g of countriesMeshes) {
            if (g.userData.name && g.userData.name.toLowerCase().trim() === nc) {
              highlightCountryRed(g);
              redCountry = g;
              break;
            }
          }
        }
      }
    }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    window.addEventListener('resize', () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    // ── Start ──
    loadCountries();

    function animate() {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      const dist = camera.position.distanceTo(controls.target);
      const speedScale = dist / 2.8;
      controls.autoRotateSpeed = 0.5 * speedScale;
      satellites.forEach(s => {
        s.angle += s.cfg.sp * 0.004 * speedScale;
        s.mesh.position.set(s.cfg.r*Math.cos(s.angle), s.cfg.r*Math.sin(s.angle)*Math.sin(s.cfg.inc), s.cfg.r*Math.sin(s.angle)*Math.cos(s.cfg.inc));
        const na = s.angle + 0.01;
        s.mesh.lookAt(s.cfg.r*Math.cos(na), s.cfg.r*Math.sin(na)*Math.sin(s.cfg.inc), s.cfg.r*Math.sin(na)*Math.cos(s.cfg.inc));
        s.light.color.setHex(Math.sin(time*3 + s.cfg.ph) > 0.7 ? 0xff3333 : 0x330000);
      });
      if (flyTarget) {
        camera.position.lerp(flyTarget, 0.015);
        if (camera.position.distanceTo(flyTarget) < 0.05) {
          camera.position.copy(flyTarget);
          flyTarget = null;
          if (redHighlightTimeout) clearTimeout(redHighlightTimeout);
          let blinkCount = 0;
          const doBlink = () => {
            if (!redCountry) return;
            if (blinkCount >= 6) {
              highlightCountryRed(redCountry);
              controls.autoRotate = true;
              return;
            }
            if (blinkCount % 2 === 0) resetHighlight(redCountry);
            else highlightCountryRed(redCountry);
            blinkCount++;
            redHighlightTimeout = setTimeout(doBlink, 500);
          };
          doBlink();
        }
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }

  // ── Search ──
  const searchInput = document.getElementById('global-search');
  const searchResults = document.getElementById('search-results');
  let timeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(timeout);
    const q = searchInput.value.trim();
    if (!q) { searchResults.style.display = 'none'; return; }
    timeout = setTimeout(async () => {
      try {
        const [reports, ids] = await Promise.all([
          fetch(window.QUANTMARK_API + '/reports').then(r => r.json()).catch(() => []),
          fetch(window.QUANTMARK_API + '/ids').then(r => r.json()).catch(() => []),
        ]);
        const rL = Array.isArray(reports) ? reports : [];
        const iL = Array.isArray(ids) ? ids : [];
        const ql = q.toLowerCase();
        const matched = [];
        // Match countries
        const cNames = window._countryNames || [];
        for (const n of cNames) {
          if (n.toLowerCase().includes(ql)) matched.push({ type: 'country', data: n });
        }
        for (const r of rL) {
          if ((r.description || '').toLowerCase().includes(ql) || (r.id || '').toLowerCase().includes(ql))
            matched.push({ type: 'report', data: r });
        }
        for (const id of iL) {
          if ((id.serial_code || '').toLowerCase().includes(ql) || (id.id || '').toLowerCase().includes(ql))
            matched.push({ type: 'watermark', data: id });
        }
        if (matched.length === 0) {
          searchResults.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--outline);font-size:12px;">Sin resultados</div>';
        } else {
          searchResults.innerHTML = matched.slice(0, 10).map(m => {
            if (m.type === 'country') {
              return `<div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle);cursor:pointer;display:flex;align-items:center;gap:0.75rem;" onclick="window._showInfoCard&&window._showInfoCard(this.dataset.name)" data-name="${m.data}">
                <span style="width:8px;height:8px;border-radius:50%;background:#44aaff;flex-shrink:0;"></span>
                <div style="flex:1;min-width:0;">
                  <div class="mono" style="font-size:12px;">${m.data}</div>
                  <div class="label-caps" style="font-size:9px;color:var(--outline);">País</div>
                </div>
              </div>`;
            }
            if (m.type === 'report') {
              return `<div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle);cursor:pointer;display:flex;align-items:center;gap:0.75rem;" onclick="navigate('/report/${encodeURIComponent(m.data.id)}')">
                <span style="width:8px;height:8px;border-radius:50%;background:var(--nothing-red);flex-shrink:0;"></span>
                <div style="flex:1;min-width:0;">
                  <div class="mono" style="font-size:12px;">${m.data.description || 'Reporte'}</div>
                  <div class="label-caps" style="font-size:9px;color:var(--outline);">Reporte · ${(m.data.created_at || '').slice(0,10)}</div>
                </div>
              </div>`;
            }
            return `<div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle);cursor:pointer;display:flex;align-items:center;gap:0.75rem;" onclick="navigate('/ids')">
              <span style="width:8px;height:8px;border-radius:50%;background:#ffffff;flex-shrink:0;"></span>
              <div style="flex:1;min-width:0;">
                <div class="mono" style="font-size:12px;">${m.data.serial_code || m.data.id}</div>
                <div class="label-caps" style="font-size:9px;color:var(--outline);">Watermark ID · ${(m.data.status || 'active')}</div>
              </div>
            </div>`;
          }).join('');
        }
        searchResults.style.display = 'block';
      } catch (_) { searchResults.style.display = 'none'; }
    }, 200);
  });
  searchInput.addEventListener('blur', () => setTimeout(() => { searchResults.style.display = 'none'; }, 300));
  searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) searchResults.style.display = 'block'; });
  searchInput.focus();

  // ── Quick category search ──
  window.showCategory = async function(type) {
    const r = document.getElementById('search-results');
    const inp = document.getElementById('global-search');
    const labels = { reports:'Reportes recientes', active:'Empresas activas', safe:'Marcas seguras', models:'Total modelos' };
    inp.value = labels[type] || type;
    try {
      let html = '';
      if (type === 'reports') {
        const d = await fetch(window.QUANTMARK_API+'/reports').then(r=>r.json()).catch(()=>[]);
        const l = Array.isArray(d)?d:[];
        if (!l.length) html = '<div style="padding:1rem;text-align:center;color:var(--outline);font-size:12px;">Sin reportes recientes</div>';
        else html = l.slice(0,10).map(x => `
          <div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle);cursor:pointer;display:flex;align-items:center;gap:0.75rem;" onclick="navigate('/report/${encodeURIComponent(x.id)}')">
            <span style="width:8px;height:8px;border-radius:50%;background:var(--nothing-red);flex-shrink:0;"></span>
            <div style="flex:1;min-width:0;">
              <div class="mono" style="font-size:12px;">${(x.description||'Reporte').slice(0,80)}${(x.description||'').length>80?'...':''}</div>
              <div class="label-caps" style="font-size:9px;color:var(--outline);">${(x.created_at||'').slice(0,10)}</div>
            </div>
          </div>`).join('');
      } else if (type === 'active') {
        const d = await fetch(window.QUANTMARK_API+'/ids').then(r=>r.json()).catch(()=>[]);
        const l = Array.isArray(d)?d:[];
        const a = l.filter(x=>(x.status||'active')==='active');
        if (!a.length) html = '<div style="padding:1rem;text-align:center;color:var(--outline);font-size:12px;">Sin empresas activas</div>';
        else html = a.slice(0,10).map(x => `
          <div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle);cursor:pointer;display:flex;align-items:center;gap:0.75rem;" onclick="navigate('/ids')">
            <span style="width:8px;height:8px;border-radius:50%;background:#44ff99;flex-shrink:0;"></span>
            <div style="flex:1;min-width:0;">
              <div class="mono" style="font-size:12px;">${x.serial_code||x.id}</div>
              <div class="label-caps" style="font-size:9px;color:var(--outline);">Activo</div>
            </div>
          </div>`).join('');
      } else if (type === 'safe') {
        const [st, reps] = await Promise.all([
          fetch(window.QUANTMARK_API+'/stats').then(r=>r.json()).catch(()=>({})),
          fetch(window.QUANTMARK_API+'/reports').then(r=>r.json()).catch(()=>[]),
        ]);
        const totalIds = (st && st.ids) || 0;
        const rL = Array.isArray(reps)?reps:[];
        const reportedIds = new Set(rL.map(x=>x.watermark_id||x.id));
        const safeCount = Math.max(0, totalIds - reportedIds.size);
        html = '<div style="padding:1rem;text-align:center;"><div class="mono" style="font-size:24px;color:#44ff99;">'+safeCount+'</div><div class="label-caps" style="font-size:10px;color:var(--outline);">marcas seguras de '+totalIds+' totales</div></div>';
      } else if (type === 'models') {
        const st = await fetch(window.QUANTMARK_API+'/stats').then(r=>r.json()).catch(()=>({}));
        const total = (st && st.models) || 0;
        html = '<div style="padding:1rem;text-align:center;"><div class="mono" style="font-size:24px;color:#dddddd;">'+total+'</div><div class="label-caps" style="font-size:10px;color:var(--outline);">modelos registrados</div></div>';
      }
      r.innerHTML = html;
    } catch(_) { r.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--outline);font-size:12px;">Error al cargar</div>'; }
    r.style.display = 'block';
  };
});
