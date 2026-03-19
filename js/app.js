// ========== SVG ICONS para tarjetas de servicio ==========
const SVG_PERSON = `
  <svg class="svc-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="18" cy="11" r="5.5"/>
    <path d="M7 33 Q7 23 18 23 Q29 23 29 33"/>
    <circle cx="27.5" cy="8.5" r="2.2" fill="currentColor" opacity="0.35" stroke="none"/>
    <line x1="26" y1="7" x2="29" y2="10"/><line x1="26" y1="10" x2="29" y2="7"/>
  </svg>`;
const SVG_SCISSORS = `
  <svg class="svc-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="7.5" cy="8" r="3.8"/><circle cx="7.5" cy="28" r="3.8"/>
    <line x1="10.8" y1="6.5" x2="31" y2="32"/><line x1="10.8" y1="29.5" x2="31" y2="4"/>
    <circle cx="18.5" cy="18.5" r="2.4" fill="currentColor" opacity="0.45" stroke="none"/>
  </svg>`;

const SVG_RAZOR = `
  <svg class="svc-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="12" width="22" height="13" rx="3"/>
    <line x1="10" y1="12" x2="10" y2="25"/>
    <path d="M14 17 L26 17"/><path d="M14 22 L26 22"/>
    <path d="M4 18.5 L10 18.5"/>
  </svg>`;

const SVG_NAIL = `
  <svg class="svc-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 30 L11 17 Q11 14 13.5 14 Q16 14 16 17 L16 22"/>
    <path d="M16 20 L16 14 Q16 11 18.5 11 Q21 11 21 14 L21 20"/>
    <path d="M21 20 L21 15 Q21 12 23.5 12 Q26 12 26 15 L26 23 Q26 30 18.5 30 L15 30 Q9 30 9 24"/>
  </svg>`;

const SVG_SPARKLE = `
  <svg class="svc-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <path d="M18 4 L20 14 L30 12 L22 19 L25 30 L18 24 L11 30 L14 19 L6 12 L16 14 Z"/>
  </svg>`;

const SVG_WASH = `
  <svg class="svc-icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 14 Q18 8 28 14 L26 28 Q18 32 10 28 Z"/>
    <path d="M14 14 Q18 10 22 14"/>
    <path d="M13 20 Q18 17 23 20"/>
  </svg>`;

function getServiceIcon(id) {
  const NAIL_IDS = ['manicure','pedicure','semi_mano','semi_pies','bano_poligel','unas_poligel','acrilicas','press_on','mantenimiento'];
  const DEPIL_IDS = ['depilacion_ceja','depilacion_bigote','depilacion_axila','cejas_c'];
  const RAZOR_IDS = ['barba'];
  const WASH_IDS  = ['lavado'];
  if (NAIL_IDS.includes(id))  return SVG_NAIL;
  if (DEPIL_IDS.includes(id)) return SVG_SPARKLE;
  if (RAZOR_IDS.includes(id)) return SVG_RAZOR;
  if (WASH_IDS.includes(id))  return SVG_WASH;
  return SVG_SCISSORS;
}

function formatDuracion(min) {
  if (min < 60) return min + ' minutos';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const horaStr = h === 1 ? '1 hora' : h + ' horas';
  if (m === 0) return horaStr;
  return horaStr + ' ' + m + ' minutos';
}

// ========== HELPERS de tiempo ==========
function slotToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minToSlot(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

// ========== APP ==========
document.addEventListener('DOMContentLoaded', () => {

  // ========== STATE ==========
  const state = {
    genero: null,
    currentStep: 1,
    servicio: null,
    barbero: null,
    fecha: null,
    hora: null,
    calendarDate: new Date(),
    diasBloqueados: [],
    servicios: [],
    barberos: []
  };

  // ========== DOM ELEMENTS ==========
  const steps      = document.querySelectorAll('.step');
  const dots       = document.querySelectorAll('.steps__dot');
  const toast      = document.getElementById('toast');
  const genderLanding = document.getElementById('genderLanding');
  const mainApp    = document.getElementById('mainApp');

  // ========== TOAST ==========
  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast' + (type ? ` toast--${type}` : '');
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => toast.classList.remove('toast--visible'), 3000);
  }

  // ========== GENDER SELECTION ==========

  function showGenderLanding() {
    goToStep(1);
    mainApp.classList.remove('is-visible');
    document.body.classList.remove('theme-damas');
    dots.forEach((dot, i) => {
      dot.classList.remove('steps__dot--active', 'steps__dot--completed');
      if (i === 0) dot.classList.add('steps__dot--active');
    });
    genderLanding.style.display = 'flex';
    genderLanding.classList.remove('is-exiting');
    state.genero = null;
  }

  function selectGenero(genero) {
    state.genero = genero;

    if (genero === 'damas') {
      document.body.classList.add('theme-damas');
    } else {
      document.body.classList.remove('theme-damas');
    }

    const logoImg = document.getElementById('headerLogoImg');
    if (genero === 'damas') {
      logoImg.src = 'Logos/Logo Damas.jpeg';
      logoImg.alt = 'Servicios para Damas';
      document.getElementById('headerGeneroLabel').textContent = 'Servicios para Damas';
    } else {
      logoImg.src = 'Logos/Logo Caballeros.jpeg';
      logoImg.alt = 'Servicios para Caballeros';
      document.getElementById('headerGeneroLabel').textContent = 'Servicios para Caballeros';
    }

    // Mostrar spinner mientras carga desde Sheets
    document.getElementById('servicioOptions').innerHTML =
      '<div class="loading"><div class="loading__spinner"></div>' +
      '<div class="loading__text">Cargando servicios...</div></div>';
    document.getElementById('barberoOptions').innerHTML = '';

    genderLanding.classList.add('is-exiting');
    setTimeout(() => {
      genderLanding.style.display = 'none';
      mainApp.classList.add('is-visible');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 400);

    loadServiciosYBarberos(genero);
  }

  async function loadServiciosYBarberos(genero) {
    let servicios = CONFIG.SERVICIOS[genero] || [];
    let barberos  = CONFIG.BARBEROS[genero]  || [];

    try {
      const [sData, bData] = await Promise.all([
        API.getServicios(genero),
        API.getBarberos(genero)
      ]);
      if (sData.servicios && sData.servicios.length)  servicios = sData.servicios;
      if (bData.barberos  && bData.barberos.length)   barberos  = bData.barberos;
    } catch (e) {
      // fallback al CONFIG local
    }

    state.servicios = servicios;
    state.barberos  = barberos;
    renderServicios(servicios);
    renderBarberos(barberos);
  }

  document.querySelectorAll('.gender-card').forEach(card => {
    card.addEventListener('click', () => selectGenero(card.dataset.genero));
  });

  document.getElementById('backToGender').addEventListener('click', () => {
    state.servicio = null;
    state.barbero  = null;
    state.fecha    = null;
    state.hora     = null;
    state.calendarDate = new Date();
    document.getElementById('clientName').value  = '';
    document.getElementById('clientPhone').value = '';
    document.querySelectorAll('.option-card--selected').forEach(c =>
      c.classList.remove('option-card--selected')
    );
    showGenderLanding();
  });

  // ========== NAVIGATION ==========
  function goToStep(stepNum) {
    steps.forEach(s => s.classList.remove('step--active'));
    document.getElementById(`step${stepNum}`).classList.add('step--active');

    dots.forEach((dot, i) => {
      dot.classList.remove('steps__dot--active', 'steps__dot--completed');
      if (i + 1 === stepNum) dot.classList.add('steps__dot--active');
      else if (i + 1 < stepNum) dot.classList.add('steps__dot--completed');
    });

    state.currentStep = stepNum;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========== STEP 1: SERVICIOS (generados dinámicamente) ==========
  function renderServicios(servicios) {
    const container = document.getElementById('servicioOptions');

    container.innerHTML = servicios.map(s =>
      `<div class="option-card" data-servicio="${s.id}">` +
        `<div class="option-card__icon">${getServiceIcon(s.id)}</div>` +
        `<div class="option-card__content">` +
          `<div class="option-card__title">${s.nombre}</div>` +
          `<div class="option-card__detail">${s.precio}</div>` +
        `</div>` +
      `</div>`
    ).join('');

    container.querySelectorAll('[data-servicio]').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('[data-servicio]').forEach(c => c.classList.remove('option-card--selected'));
        card.classList.add('option-card--selected');
        state.servicio = card.dataset.servicio;
        setTimeout(() => goToStep(2), 300);
      });
    });

    animateOptionIcons(container);
  }

  // ========== STEP 2: BARBERO (generados dinámicamente) ==========
  const BARBERO_FOTOS = {
    'Sebastián': 'Sebastian.jpeg',
    'César':     'Cesar.jpeg',
    'Rocío':     'Rocio.jpeg'
  };

  function renderBarberos(barberos) {
    const container = document.getElementById('barberoOptions');
    container.innerHTML = barberos.map(b => {
      const foto = BARBERO_FOTOS[b];
      const iconHTML = foto
        ? `<img src="${foto}" alt="${b}" class="option-card__photo" data-nombre="${b}">`
        : SVG_PERSON;
      return `<div class="option-card" data-barbero="${b}">` +
        `<div class="option-card__icon${foto ? ' option-card__icon--photo' : ''}">${iconHTML}</div>` +
        `<div class="option-card__content">` +
          `<div class="option-card__title">${b}</div>` +
          `<div class="option-card__detail">${CONFIG.BARBEROS.damas.includes(b) ? 'Estilista Profesional' : 'Barbero Profesional'}</div>` +
        `</div>` +
      `</div>`;
    }).join('');

    // Fallback al SVG si la foto no carga
    container.querySelectorAll('.option-card__photo').forEach(img => {
      img.addEventListener('error', () => {
        const icon = img.parentElement;
        icon.classList.remove('option-card__icon--photo');
        icon.innerHTML = SVG_PERSON;
      });
    });

    container.querySelectorAll('[data-barbero]').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('[data-barbero]').forEach(c => c.classList.remove('option-card--selected'));
        card.classList.add('option-card--selected');
        state.barbero = card.dataset.barbero;
        loadDiasBloqueados();
        setTimeout(() => goToStep(3), 300);
      });
    });

    animateOptionIcons(container);
  }

  document.getElementById('backToStep1').addEventListener('click', () => goToStep(1));

  // ========== BLOCKED DAYS ==========
  async function loadDiasBloqueados() {
    try {
      const data = await API.getDiasBloqueados();
      state.diasBloqueados = data.diasBloqueados || [];
    } catch {
      state.diasBloqueados = [];
    }
    renderCalendar();
  }

  // Día completamente bloqueado (sin horas específicas)
  function isDiaBlocked(dateStr) {
    return state.diasBloqueados.some(
      d => d.fecha === dateStr && (d.barbero === state.barbero || d.barbero === 'Todos') && !d.horas
    );
  }

  // Slot bloqueado parcialmente: verifica si [slotMin, slotMin+duracion) solapa con alguna hora bloqueada (intervalos de 30 min)
  function isSlotBlocked(dateStr, slotTime, duracion) {
    const slotMin = slotToMin(slotTime);
    return state.diasBloqueados.some(d => {
      if (d.fecha !== dateStr) return false;
      if (d.barbero !== state.barbero && d.barbero !== 'Todos') return false;
      if (!d.horas) return false; // día completo ya manejado en isDiaBlocked
      return d.horas.split(',').some(h => {
        const btMin = slotToMin(h.trim());
        return slotMin < btMin + 45 && slotMin + duracion > btMin;
      });
    });
  }

  // ========== STEP 3: CALENDAR ==========
  const calMonth = document.getElementById('calMonth');
  const calDays  = document.getElementById('calDays');

  function renderCalendar() {
    const year  = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    calMonth.textContent = `${CONFIG.MESES[month]} ${year}`;

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    for (let i = 0; i < firstDay; i++) {
      html += '<button class="calendar__day calendar__day--empty" disabled></button>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const dateStr   = formatDate(date);
      const isPast    = date < today;
      const isBlocked = isDiaBlocked(dateStr);
      const isToday   = date.getTime() === today.getTime();
      const isSelected = state.fecha === dateStr;

      let classes = 'calendar__day';
      if (isToday)    classes += ' calendar__day--today';
      if (isSelected) classes += ' calendar__day--selected';
      if (isPast) classes += ' calendar__day--disabled';
      if (isBlocked)  classes += ' calendar__day--disabled calendar__day--blocked';

      const disabled = isPast || isBlocked ? 'disabled' : '';

      html += `<button class="${classes}" data-date="${dateStr}" ${disabled}>${day}</button>`;
    }

    calDays.innerHTML = html;

    calDays.querySelectorAll('.calendar__day:not(.calendar__day--disabled):not(.calendar__day--empty)').forEach(btn => {
      btn.addEventListener('click', () => {
        calDays.querySelectorAll('.calendar__day').forEach(b => b.classList.remove('calendar__day--selected'));
        btn.classList.add('calendar__day--selected');
        state.fecha = btn.dataset.date;
        const svcActual = getServicioActual();
        if (svcActual && svcActual.sinHora) {
          state.hora = 'A coordinar';
          updateSummary();
          goToStep(5);
        } else {
          loadSlots();
          goToStep(4);
        }
      });
    });
  }

  document.getElementById('calPrev').addEventListener('click', () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('backToStep2').addEventListener('click', () => goToStep(2));

  // ========== STEP 4: SLOTS ==========
  function getServicioActual() {
    return (state.servicios.length ? state.servicios : (CONFIG.SERVICIOS[state.genero] || []))
      .find(s => s.id === state.servicio);
  }

  async function loadSlots() {
    const loading  = document.getElementById('slotsLoading');
    const grid     = document.getElementById('slotsGrid');
    const dateText = document.getElementById('selectedDateText');

    const parts   = state.fecha.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    dateText.textContent = `${CONFIG.DIAS_SEMANA[dateObj.getDay()]} ${parts[2]} de ${CONFIG.MESES[dateObj.getMonth()]}`;

    loading.style.display = 'block';
    grid.style.display    = 'none';

    let ocupados = [];
    try {
      const data = await API.getSlots(state.fecha, state.barbero);
      ocupados = data.ocupados || [];
    } catch {
      ocupados = [];
    }

    loading.style.display = 'none';
    grid.style.display    = 'grid';

    const servicio   = getServicioActual();
    const duracion   = servicio.duracion;
    const allSlots   = generateSlots(duracion);
    const now        = new Date();
    const isToday    = state.fecha === formatDate(now);
    const nowMin     = now.getHours() * 60 + now.getMinutes();

    let html = '';
    let disponibles = 0;
    allSlots.forEach(slot => {
      const isPast      = isToday && slotToMin(slot) < nowMin;
      const isConflict  = hayConflicto(slot, duracion, ocupados);
      const isHoraBloq  = isSlotBlocked(state.fecha, slot, duracion);
      const disabled    = isPast || isConflict || isHoraBloq;
      if (!disabled) disponibles++;
      const cls        = disabled ? 'slot slot--disabled' : 'slot';
      html += `<button class="${cls}" data-hora="${slot}" ${disabled ? 'disabled' : ''}>${slot}</button>`;
    });

    if (disponibles === 0) {
      grid.innerHTML = '<p class="slots-empty">No hay horarios disponibles para este día. Por favor selecciona otra fecha.</p>';
    } else {
      grid.innerHTML = html;
    }

    grid.querySelectorAll('.slot:not(.slot--disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.slot').forEach(b => b.classList.remove('slot--selected'));
        btn.classList.add('slot--selected');
        state.hora = btn.dataset.hora;
        updateSummary();
        goToStep(5);
      });
    });
  }

  // Slots fijos de atención para caballeros (cada 45 min, 9:00 → 21:00)
  const SLOTS_FIJOS = [
    '09:00','09:45','10:30','11:15','12:00','12:45',
    '13:30','14:15','15:00','15:45','16:30','17:15',
    '18:00','18:45','19:30','20:15','21:00'
  ];

  // Caballeros: slots fijos. Damas: cálculo dinámico según duración del servicio.
  function generateSlots(duracion) {
    if (state.genero === 'damas') {
      const slots = [];
      const inicioMin = CONFIG.HORARIO.inicio * 60;
      const finMin    = CONFIG.HORARIO.fin * 60;
      const base      = CONFIG.HORARIO.slotBase;
      for (let m = inicioMin; m + duracion <= finMin; m += base) {
        slots.push(minToSlot(m));
      }
      return slots;
    }
    return SLOTS_FIJOS;
  }

  // Un slot tiene conflicto si su rango [inicio, inicio+duracion) se solapa con algún bloque ocupado
  function hayConflicto(slot, duracion, ocupados) {
    const inicio = slotToMin(slot);
    const fin    = inicio + duracion;
    return ocupados.some(occ => {
      const occInicio = slotToMin(occ.hora);
      const occFin    = slotToMin(occ.horaFin);
      return inicio < occFin && fin > occInicio;
    });
  }

  document.getElementById('backToStep3').addEventListener('click', () => goToStep(3));

  // ========== STEP 5: CLIENT DATA ==========
  function updateSummary() {
    const servicio = getServicioActual();
    document.getElementById('sumServicio').textContent = servicio ? servicio.nombre : '';
    document.getElementById('sumBarbero').textContent  = state.barbero;

    const parts   = state.fecha.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    document.getElementById('sumFecha').textContent = `${CONFIG.DIAS_SEMANA[dateObj.getDay()]} ${parts[2]} de ${CONFIG.MESES[dateObj.getMonth()]}`;
    const svcResumen = getServicioActual();
    document.getElementById('sumHora').textContent = (svcResumen && svcResumen.sinHora) ? 'A coordinar con la estilista' : state.hora;
  }

  document.getElementById('backToStep4').addEventListener('click', () => {
    const svc = getServicioActual();
    goToStep(svc && svc.sinHora ? 3 : 4);
  });

  document.getElementById('clientForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre   = document.getElementById('clientName').value.trim();
    const telefono = document.getElementById('clientPhone').value.trim();

    if (!nombre || !telefono) {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const btnConfirm = document.getElementById('btnConfirm');
    btnConfirm.disabled    = true;
    btnConfirm.textContent = 'Reservando...';

    const servicio = getServicioActual();
    const esSinHora = servicio && servicio.sinHora;
    const duracion  = esSinHora ? 0 : servicio.duracion;
    const hora      = esSinHora ? 'A coordinar' : state.hora;
    const horaFin   = esSinHora ? 'A coordinar' : minToSlot(slotToMin(state.hora) + duracion);

    try {
      await API.reservar({
        fecha:    state.fecha,
        hora:     hora,
        horaFin:  horaFin,
        duracion: duracion,
        barbero:  state.barbero,
        servicio: servicio.nombre,
        cliente:  nombre,
        telefono: telefono
      });

      showConfirmation(servicio.nombre, state.barbero, state.fecha, hora, horaFin, nombre, esSinHora);
      goToStep(6);
    } catch {
      showToast('Error al reservar. Intenta de nuevo.', 'error');
    } finally {
      btnConfirm.disabled    = false;
      btnConfirm.textContent = 'Confirmar';
    }
  });

  // ========== STEP 6: CONFIRMATION ==========
  function showConfirmation(servicio, barbero, fecha, hora, horaFin, cliente, sinHora = false) {
    // Limpiar tarjeta WhatsApp anterior si existe
    const oldWsp = document.querySelector('.wsp-card');
    if (oldWsp) oldWsp.remove();

    const parts    = fecha.split('-');
    const dateObj  = new Date(parts[0], parts[1] - 1, parts[2]);
    const fechaStr = `${CONFIG.DIAS_SEMANA[dateObj.getDay()]} ${parts[2]} de ${CONFIG.MESES[dateObj.getMonth()]} ${parts[0]}`;

    const horaRow = sinHora
      ? `<div class="confirmation__detail-row">
           <span class="confirmation__detail-label">Hora</span>
           <span class="confirmation__detail-value">A coordinar con la estilista</span>
         </div>`
      : `<div class="confirmation__detail-row">
           <span class="confirmation__detail-label">Hora</span>
           <span class="confirmation__detail-value">${hora} – ${horaFin}</span>
         </div>
         <div class="confirmation__detail-row">
           <span class="confirmation__detail-label">Duración estimada</span>
           <span class="confirmation__detail-value">${formatDuracion(slotToMin(horaFin) - slotToMin(hora))}</span>
         </div>`;

    document.getElementById('confirmationDetail').innerHTML = `
      <div class="confirmation__detail-row">
        <span class="confirmation__detail-label">Cliente</span>
        <span class="confirmation__detail-value">${cliente}</span>
      </div>
      <div class="confirmation__detail-row">
        <span class="confirmation__detail-label">Servicio</span>
        <span class="confirmation__detail-value">${servicio}</span>
      </div>
      <div class="confirmation__detail-row">
        <span class="confirmation__detail-label">Especialista</span>
        <span class="confirmation__detail-value">${barbero}</span>
      </div>
      <div class="confirmation__detail-row">
        <span class="confirmation__detail-label">Fecha</span>
        <span class="confirmation__detail-value">${fechaStr}</span>
      </div>
      ${horaRow}
    `;

    const wsp = CONFIG.WSP[barbero];
    const wspTitulo = sinHora
      ? '¡Coordina tu hora con Rocío!'
      : '¿Tienes alguna duda?';
    const wspSub = sinHora
      ? `Contáctala por WhatsApp para definir la hora de tu <strong>${servicio}</strong>`
      : `Escríbele a <strong>${wsp ? wsp.nombre : barbero}</strong> por WhatsApp`;

    const wspCard = wsp ? `
      <a class="wsp-card${sinHora ? ' wsp-card--destacado' : ''}" href="https://wa.me/${wsp.numero}" target="_blank" rel="noopener">
        <div class="wsp-card__icon">
          <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.522.658 4.888 1.806 6.938L2 30l7.282-1.776A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.56 11.56 0 01-5.9-1.612l-.42-.252-4.326 1.054 1.09-4.2-.276-.432A11.56 11.56 0 014.4 16C4.4 9.593 9.593 4.4 16 4.4S27.6 9.593 27.6 16 22.407 27.6 16 27.6zm6.344-8.67c-.348-.174-2.06-1.016-2.38-1.132-.32-.116-.552-.174-.784.174-.232.348-.9 1.132-1.102 1.364-.202.232-.404.26-.752.086-.348-.174-1.47-.542-2.8-1.726-1.034-.922-1.732-2.06-1.934-2.408-.202-.348-.022-.536.152-.71.156-.154.348-.404.522-.606.174-.202.232-.348.348-.58.116-.232.058-.434-.029-.608-.087-.174-.784-1.89-1.074-2.588-.282-.68-.57-.588-.784-.598l-.666-.012c-.232 0-.608.087-.926.434-.318.347-1.218 1.19-1.218 2.902s1.246 3.366 1.42 3.598c.174.232 2.452 3.742 5.942 5.248.83.358 1.478.572 1.984.732.834.264 1.594.226 2.194.138.67-.1 2.06-.842 2.35-1.656.29-.814.29-1.512.204-1.658-.086-.144-.318-.23-.666-.404z"/>
          </svg>
        </div>
        <div class="wsp-card__text">
          <div class="wsp-card__title">${wspTitulo}</div>
          <div class="wsp-card__sub">${wspSub}</div>
        </div>
        <div class="wsp-card__arrow">&#8594;</div>
      </a>
    ` : '';

    document.getElementById('confirmationDetail').insertAdjacentHTML('afterend', wspCard);
  }

  document.getElementById('btnNewBooking').addEventListener('click', () => {
    state.servicio = null;
    state.barbero  = null;
    state.fecha    = null;
    state.hora     = null;
    state.calendarDate = new Date();
    document.getElementById('clientName').value  = '';
    document.getElementById('clientPhone').value = '';
    document.querySelectorAll('.option-card--selected').forEach(c =>
      c.classList.remove('option-card--selected')
    );
    showGenderLanding();
  });

  // ========== HELPERS ==========
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ========== ANIME.JS – iconos de tarjetas de opción ==========
  function animateOptionIcons(container) {
    if (typeof anime === 'undefined') return;
    container.querySelectorAll('.option-card__icon').forEach((el, i) => {
      anime({
        targets: el,
        translateY: [0, -5],
        duration: () => anime.random(1800, 3000),
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        delay: i * 130
      });
    });
  }

  // ========== ANIME.JS – movimiento flotante de iconos deco ==========
  function initDecoAnimations() {
    if (typeof anime === 'undefined') return;

    document.querySelectorAll('.gender-card--caballeros .gc-deco').forEach((el, i) => {
      anime({
        targets: el,
        translateX: () => anime.random(-10, 10),
        translateY: () => anime.random(-12, 6),
        duration:   () => anime.random(3000, 5500),
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        delay: i * 650
      });
    });

    document.querySelectorAll('.gender-card--damas .gc-deco').forEach((el, i) => {
      anime({
        targets: el,
        translateX: () => anime.random(-10, 10),
        translateY: () => anime.random(-12, 6),
        duration:   () => anime.random(3200, 5800),
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        delay: i * 550 + 300
      });
    });
  }

  // ========== INIT ==========
  renderCalendar();
  initDecoAnimations();
});
