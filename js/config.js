const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbw4Uc8ofQCAx3Q-wPgHxXMM67o-TrzbMATLj18IC-xBBRAvTAocVkIo7PPoYdslQWfE/exec',

  BARBEROS: {
    caballeros: ['Sebastián', 'César'],
    damas:      ['Rocío']
  },

  SERVICIOS: {
    caballeros: [
      { id: 'corte_caballero', nombre: 'Corte Caballero',  precio: '$18k', duracion: 45 },
      { id: 'corte_ninos',     nombre: 'Corte Niños',      precio: '$16k', duracion: 45 },
      { id: 'barba',           nombre: 'Barba',             precio: '$8k',  duracion: 20 },
      { id: 'corte_barba',     nombre: 'Corte + Barba',     precio: '$25k', duracion: 60 },
      { id: 'cejas_c',         nombre: 'Cejas',             precio: '$3k',  duracion: 10 },
      { id: 'lavado',          nombre: 'Lavado',            precio: '$2k',  duracion: 10 }
    ],
    damas: [
      { id: 'manicure',          nombre: 'Manicure Tradicional',  precio: '$15k',      duracion: 30  },
      { id: 'pedicure',          nombre: 'Pedicure Tradicional',  precio: '$20k',      duracion: 40  },
      { id: 'semi_mano',         nombre: 'Semipermanente Mano',   precio: '$50k',      duracion: 60  },
      { id: 'semi_pies',         nombre: 'Semipermanente Pies',   precio: '$45k',      duracion: 60  },
      { id: 'bano_poligel',      nombre: 'Baño Poligel',          precio: '$70k',      duracion: 120 },
      { id: 'unas_poligel',      nombre: 'Uñas Poligel',          precio: '$100k',     duracion: 180 },
      { id: 'acrilicas',         nombre: 'Acrílicas',             precio: '$100k',     duracion: 180 },
      { id: 'press_on',          nombre: 'Press-on',              precio: '$85k',      duracion: 120 },
      { id: 'mantenimiento',     nombre: 'Mantenimiento',         precio: 'Desde $60k', duracion: 120 },
      { id: 'corte_dama',        nombre: 'Corte Dama',            precio: '$14k',      duracion: 30  },
      { id: 'depilacion_ceja',   nombre: 'Depilación Ceja',       precio: '$9k',       duracion: 10  },
      { id: 'depilacion_bigote', nombre: 'Depilación Bigote',     precio: '$6k',       duracion: 10  },
      { id: 'depilacion_axila',  nombre: 'Depilación Axila',      precio: '$12k',      duracion: 20  },
      { id: 'keratina',          nombre: 'Keratina',              precio: 'A convenir', duracion: null, sinHora: true },
      { id: 'celulas_madre',     nombre: 'Células Madre',         precio: 'A convenir', duracion: null, sinHora: true },
      { id: 'alisado',           nombre: 'Alisado',               precio: 'A convenir', duracion: null, sinHora: true },
      { id: 'cepillado',         nombre: 'Cepillado',             precio: 'A convenir', duracion: null, sinHora: true }
    ]
  },

  HORARIO: {
    inicio:   9,   // hora de apertura
    fin:      21,  // hora de cierre
    slotBase: 10   // granularidad mínima en minutos
  },

  DIAS_SEMANA: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  MESES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],

  DIA_CERRADO: 0,

  NOMBRE_BARBERIA: 'RC Barber & Spa / RC Nicoll\'s',

  WSP: {
    'César':     { numero: '573108048028', nombre: 'César Quintero' },
    'Sebastián': { numero: '573025441491', nombre: 'Sebastián Quintero' },
    'Rocío':     { numero: '573213017130', nombre: 'Rocío Castillo' }
  }
};
