const API_BASE = window.QUANTMARK_API || 'http://localhost:8000';

function getApiKey() {
  return localStorage.getItem('qm_api_key');
}

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  const key = getApiKey();
  if (key) h['X-API-Key'] = key;
  return h;
}

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
  return data;
}

const api = {
  // Auth
  register: (name, email, country, province) => request('POST', '/auth/register', { name, email, country, province }),

  // Models
  getModels: () => request('GET', '/models'),
  createModel: (name, description) => request('POST', '/models', { name, description }),

  // Watermark IDs
  getIds: (params = '') => request('GET', `/ids${params}`),
  getId: (id) => request('GET', `/ids/${id}`),
  createId: (model_id) => request('POST', '/ids', { model_id }),
  revokeId: (id) => request('PATCH', `/ids/${id}`, { status: 'revoked' }),

  // Movements
  getMovements: (wmId) => request('GET', `/ids/${wmId}/movements`),
  createMovement: (wmId, event_type, extra_metadata = {}) =>
    request('POST', `/ids/${wmId}/movements`, { event_type, extra_metadata }),

  // Reports
  getReports: (params = '') => request('GET', `/reports${params}`),
  getReport: (id) => request('GET', `/reports/${id}`),
  createReport: (wmId, description, evidence_url = null) =>
    request('POST', `/ids/${wmId}/report`, { description, evidence_url }),
};

// Helper: get company info from stored data
function getCompany() {
  const raw = localStorage.getItem('qm_company');
  return raw ? JSON.parse(raw) : null;
}

function setCompany(company, apiKey) {
  localStorage.setItem('qm_company', JSON.stringify(company));
  localStorage.setItem('qm_api_key', apiKey);
}

function logout() {
  localStorage.removeItem('qm_company');
  localStorage.removeItem('qm_api_key');
  window.location.hash = '#/login';
}

function isLoggedIn() {
  return !!getApiKey();
}
