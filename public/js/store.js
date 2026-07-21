const store = {
  state: {
    models: [],
    ids: [],
    reports: [],
    movements: [],
    company: getCompany(),
  },

  async loadModels() {
    this.state.models = await api.getModels();
  },

  async loadIds(params = '') {
    this.state.ids = await api.getIds(params);
  },

  async loadReports(params = '') {
    this.state.reports = await api.getReports(params);
  },

  async loadMovements(wmId) {
    this.state.movements = await api.getMovements(wmId);
  },

  getModel(id) {
    return this.state.models.find(m => m.id === id);
  },

  getId(id) {
    return this.state.ids.find(w => w.id === id || w.serial_code === id);
  },

  clear() {
    this.state.models = [];
    this.state.ids = [];
    this.state.reports = [];
    this.state.movements = [];
  },
};
