const API = {
  _jsonp(params, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const callbackName = 'cb_' + Date.now() + '_' + Math.round(Math.random() * 100000);

      const url = new URL(CONFIG.API_URL);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      url.searchParams.append('callback', callbackName);

      const script = document.createElement('script');

      const cleanup = () => {
        clearTimeout(timer);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      // Sin esto, una conexión lenta o inestable deja la promesa colgada para
      // siempre (el script carga pero el servidor nunca llama al callback):
      // la pantalla se queda "cargando" en vez de avisar del problema.
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Tiempo de espera agotado'));
      }, timeoutMs);

      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Error de conexión'));
      };

      script.src = url.toString();
      document.head.appendChild(script);
    });
  },

  async getServicios(genero) {
    return this._jsonp({ action: 'getServicios', genero });
  },

  async getBarberos(genero) {
    return this._jsonp({ action: 'getBarberos', genero });
  },

  async getSlots(fecha, barbero) {
    return this._jsonp({ action: 'getSlots', fecha, barbero });
  },

  async getCitas(fecha) {
    return this._jsonp({ action: 'getCitas', fecha });
  },

  async getDiasBloqueados() {
    return this._jsonp({ action: 'getDiasBloqueados' });
  },

  async reservar({ fecha, hora, horaFin, duracion, barbero, servicio, cliente, telefono }) {
    return this._jsonp({
      action: 'reservar',
      fecha, hora, horaFin, duracion, barbero, servicio, cliente, telefono
    });
  },

  async cancelarCita(id) {
    return this._jsonp({ action: 'cancelarCita', id });
  },

  async bloquearDia({ fecha, barbero, motivo, horas }) {
    return this._jsonp({ action: 'bloquearDia', fecha, barbero, motivo, horas: horas || '' });
  },

  async desbloquearDia({ fecha, barbero, horas }) {
    return this._jsonp({ action: 'desbloquearDia', fecha, barbero, horas: horas || '' });
  },

  async verificarPin(pin) {
    return this._jsonp({ action: 'verificarPin', pin });
  },

  async getCitasRango(fechaInicio, fechaFin) {
    return this._jsonp({ action: 'getCitasRango', fechaInicio, fechaFin });
  },
};
