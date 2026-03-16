document.addEventListener('DOMContentLoaded', () => {

  // ========== STATE ==========
  const state = {
    authenticated: false,
    selectedBarbero: null,
    selectedDate: formatToday(),
    citas: []
  };

  // ========== DOM ==========
  const pinSection  = document.getElementById('pinSection');
  const dashboard   = document.getElementById('dashboard');
  const toast       = document.getElementById('toast');
  const pinDigits   = document.querySelectorAll('.pin-input__digit');
  const pinError    = document.getElementById('pinError');

  // ========== TOAST ==========
  function showToast(msg, type = '') {
    toast.textContent = msg;
    toast.className   = 'toast' + (type ? ` toast--${type}` : '');
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => toast.classList.remove('toast--visible'), 3000);
  }

  // ========== PIN INPUT ==========
  pinDigits.forEach((input, i) => {
    input.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value && i < pinDigits.length - 1) pinDigits[i + 1].focus();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) pinDigits[i - 1].focus();
      if (e.key === 'Enter') handleLogin();
    });
    input.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '');
      for (let j = 0; j < Math.min(pasted.length, pinDigits.length); j++) pinDigits[j].value = pasted[j];
      pinDigits[Math.min(pasted.length, pinDigits.length - 1)].focus();
    });
  });
  pinDigits[0].focus();

  // ========== LOGIN ==========
  document.getElementById('btnLogin').addEventListener('click', handleLogin);

  async function handleLogin() {
    const pin = Array.from(pinDigits).map(d => d.value).join('');
    if (pin.length !== 4) {
      pinError.classList.add('pin-error--visible');
      pinError.textContent = 'Ingresa los 4 dígitos';
      return;
    }
    try {
      const data = await API.verificarPin(pin);
      if (data.valid) {
        pinSection.style.display = 'none';
        dashboard.classList.add('dashboard--active');
        initDashboard();
      } else {
        pinError.textContent = 'PIN incorrecto. Intenta de nuevo.';
        pinError.classList.add('pin-error--visible');
        pinDigits.forEach(d => d.value = '');
        pinDigits[0].focus();
      }
    } catch { showToast('Error de conexión', 'error'); }
  }

  // ========== LOGOUT ==========
  document.getElementById('btnLogout').addEventListener('click', () => {
    pinSection.style.display = '';
    dashboard.classList.remove('dashboard--active');
    pinDigits.forEach(d => d.value = '');
    pinError.classList.remove('pin-error--visible');
    pinDigits[0].focus();
  });

  // ========== INIT ==========
  function initDashboard() {
    buildBarberoTabs();
    initExtraForm();
    document.getElementById('adminDatePicker').value = state.selectedDate;
    setDefaultMetricsDates();
    loadWeekMetrics();
    loadCitas();
    loadDiasBloqueados();
  }

  function setDefaultMetricsDates() {
    const week = getCurrentWeekRange();
    document.getElementById('metricsFechaInicio').value = week.inicio;
    document.getElementById('metricsFechaFin').value    = week.fin;
  }

  // ========== BARBERO TABS (dinámico) ==========
  function buildBarberoTabs() {
    const container = document.getElementById('barberoTabs');
    const todos = [
      ...CONFIG.BARBEROS.caballeros.map(n => ({ nombre: n, genero: 'caballeros' })),
      ...CONFIG.BARBEROS.damas.map(n => ({ nombre: n, genero: 'damas' }))
    ];
    state.selectedBarbero = todos[0].nombre;

    container.innerHTML = todos.map((b, i) =>
      `<button class="barbero-tab ${i === 0 ? 'barbero-tab--active' : ''} barbero-tab--${b.genero}"
        data-barbero="${b.nombre}">${b.nombre}</button>`
    ).join('');

    container.querySelectorAll('.barbero-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.barbero-tab').forEach(t => t.classList.remove('barbero-tab--active'));
        tab.classList.add('barbero-tab--active');
        state.selectedBarbero = tab.dataset.barbero;
        renderCitas();
      });
    });
  }

  // ========== CITAS DEL DÍA ==========
  document.getElementById('btnLoadCitas').addEventListener('click', () => {
    state.selectedDate = document.getElementById('adminDatePicker').value;
    loadCitas();
  });

  async function loadCitas() {
    const loading = document.getElementById('citasLoading');
    const list    = document.getElementById('citasList');
    loading.style.display = 'block';
    list.innerHTML = '';
    try {
      const data = await API.getCitas(state.selectedDate);
      state.citas = data.citas || [];
    } catch {
      state.citas = [];
      showToast('Error al cargar citas', 'error');
    }
    loading.style.display = 'none';
    renderCitas();
  }

  function renderCitas() {
    const list     = document.getElementById('citasList');
    const filtered = state.citas.filter(c => c.barbero === state.selectedBarbero);

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-state__icon">📅</div>
        <p class="empty-state__text">No hay citas para ${state.selectedBarbero} en esta fecha.</p>
      </div>`;
      return;
    }

    filtered.sort((a, b) => String(a.hora).localeCompare(String(b.hora)));

    list.innerHTML = filtered.map(c => `
      <div class="cita-card ${c.estado === 'cancelada' ? 'cita-card--cancelled' : ''}">
        <div class="cita-card__info">
          <div class="cita-card__time">${formatHora(c.hora)} – ${formatHora(c.horaFin)}</div>
          <div class="cita-card__client">${escapeHtml(c.cliente)}</div>
          <div class="cita-card__details">${escapeHtml(c.servicio)} &bull; Tel: ${escapeHtml(c.telefono)}
            ${c.estado === 'cancelada' ? ' &bull; <span style="color:var(--danger)">CANCELADA</span>' : ''}
          </div>
        </div>
        <div class="cita-card__actions">
          ${c.estado !== 'cancelada' ? `<button class="btn btn--danger" onclick="cancelarCita('${c.id}','${escapeAttr(c.telefono)}','${escapeAttr(c.cliente)}','${formatHora(c.hora)}','${escapeAttr(c.fecha)}')">Cancelar</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  window.cancelarCita = async function(id, telefono, cliente, hora, fecha) {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await API.cancelarCita(id);
      showToast('Cita cancelada', 'success');
      loadCitas();
      showWspNotify(
        telefono, cliente,
        `Hola ${cliente}, lamentamos informarte que tu cita del ${formatFechaDisplay(fecha)} a las ${hora} fue cancelada. Por favor contáctanos para reprogramar.`,
        'cancel'
      );
    } catch { showToast('Error al cancelar', 'error'); }
  };

  // ========== WSP NOTIFY ==========
  function showWspNotify(telefono, cliente, mensaje, tipo) {
    const numero = '57' + String(telefono || '').replace(/\D/g, '');
    const url    = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensaje);
    document.getElementById('wspNotifyText').innerHTML =
      (tipo === 'cancel' ? '<strong>Cita cancelada.</strong>' : '<strong>Cita confirmada.</strong>') +
      ' ¿Notificar a <strong>' + escapeHtml(cliente) + '</strong> por WhatsApp?';
    document.getElementById('wspNotifyLink').href = url;
    document.getElementById('wspNotify').classList.add('wsp-notify--visible');
    clearTimeout(window._wspTimer);
    window._wspTimer = setTimeout(closeWspNotify, 30000);
  }

  window.closeWspNotify = function() {
    document.getElementById('wspNotify').classList.remove('wsp-notify--visible');
  };

  // ========== CITAS EXTRAORDINARIAS ==========
  function initExtraForm() {
    const espSelect = document.getElementById('extraEsp');
    const todos = [
      ...CONFIG.BARBEROS.caballeros.map(n => n),
      ...CONFIG.BARBEROS.damas.map(n => n)
    ];
    espSelect.innerHTML = todos.map(n => `<option value="${n}">${n}</option>`).join('');

    espSelect.addEventListener('change', updateExtraServices);
    document.getElementById('extraServicio').addEventListener('change', updateExtraHoraFin);
    document.getElementById('extraHora').addEventListener('input', updateExtraHoraFin);
    document.getElementById('extraForm').addEventListener('submit', async e => {
      e.preventDefault();
      await bookExtraOrdinaria();
    });

    updateExtraServices();
  }

  function updateExtraServices() {
    const esp    = document.getElementById('extraEsp').value;
    const genero = CONFIG.BARBEROS.caballeros.includes(esp) ? 'caballeros' : 'damas';
    document.getElementById('extraServicio').innerHTML =
      CONFIG.SERVICIOS[genero].map(s =>
        `<option value="${s.id}" data-duracion="${s.duracion}" data-nombre="${escapeAttr(s.nombre)}">${s.nombre} — ${s.precio}</option>`
      ).join('');
    updateExtraHoraFin();
  }

  function updateExtraHoraFin() {
    const horaStr = document.getElementById('extraHora').value;
    const opt     = document.getElementById('extraServicio').selectedOptions[0];
    if (!horaStr || !opt) return;
    const dur    = parseInt(opt.dataset.duracion);
    const [h, m] = horaStr.split(':').map(Number);
    const total  = h * 60 + m + dur;
    const fH     = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const fM     = String(total % 60).padStart(2, '0');
    document.getElementById('extraHoraFin').value = `${fH}:${fM}`;
  }

  async function bookExtraOrdinaria() {
    const esp      = document.getElementById('extraEsp').value;
    const fecha    = document.getElementById('extraFecha').value;
    const hora     = document.getElementById('extraHora').value;
    const horaFin  = document.getElementById('extraHoraFin').value;
    const opt      = document.getElementById('extraServicio').selectedOptions[0];
    const servicio = opt ? opt.dataset.nombre : '';
    const duracion = opt ? parseInt(opt.dataset.duracion) : 0;
    const cliente  = document.getElementById('extraCliente').value.trim();
    const telefono = document.getElementById('extraTelefono').value.trim();

    if (!fecha || !hora || !horaFin || !cliente || !telefono) {
      showToast('Completa todos los campos', 'error'); return;
    }

    const btn = document.getElementById('btnExtraReservar');
    btn.disabled = true; btn.textContent = 'Guardando...';

    try {
      const data = await API.reservar({ fecha, hora, horaFin, duracion, barbero: esp, servicio, cliente, telefono });
      if (data.error) {
        showToast(data.error, 'error');
      } else {
        showToast('Cita extraordinaria guardada', 'success');
        document.getElementById('extraForm').reset();
        updateExtraServices();
        showWspNotify(
          telefono, cliente,
          `Hola ${cliente}, tu cita con ${esp} ha sido confirmada para el ${formatFechaDisplay(fecha)} a las ${hora}. ¡Te esperamos!`,
          'confirm'
        );
      }
    } catch { showToast('Error al guardar la cita', 'error'); }

    btn.disabled = false; btn.textContent = 'Agendar cita';
  }

  // ========== MÉTRICAS ==========
  document.getElementById('btnLoadMetrics').addEventListener('click', loadMetricsFromFilter);

  async function loadWeekMetrics() {
    const week = getCurrentWeekRange();
    await loadMetrics(week.inicio, week.fin, '');
  }

  async function loadMetricsFromFilter() {
    const fi  = document.getElementById('metricsFechaInicio').value;
    const ff  = document.getElementById('metricsFechaFin').value;
    const gen = document.getElementById('metricsGenero').value;
    if (!fi || !ff) { showToast('Selecciona el rango de fechas', 'error'); return; }
    if (fi > ff)    { showToast('La fecha inicial debe ser antes de la final', 'error'); return; }
    await loadMetrics(fi, ff, gen);
  }

  async function loadMetrics(fechaInicio, fechaFin, genero) {
    document.getElementById('metricsLoading').style.display = 'block';
    document.getElementById('metricsContent').style.display = 'none';

    try {
      const data = await API.getCitasRango(fechaInicio, fechaFin);
      let citas = data.citas || [];

      if (genero) {
        const filtro = CONFIG.BARBEROS[genero] || [];
        citas = citas.filter(c => filtro.includes(c.barbero));
      }

      const metrics = calcMetrics(citas);
      renderMetricCards(metrics, fechaInicio, fechaFin);
      renderWeekChart(citas, fechaInicio, fechaFin);
      renderServicesRank(metrics.servicioCount);
    } catch {
      showToast('Error al cargar métricas', 'error');
    }

    document.getElementById('metricsLoading').style.display = 'none';
    document.getElementById('metricsContent').style.display = 'block';
  }

  function calcMetrics(citas) {
    const precioMap = buildPrecioMap();
    let ingresos = 0;
    const servicioCount = {};
    const diaCount = {};

    citas.forEach(c => {
      ingresos += precioMap[c.servicio] || 0;
      servicioCount[c.servicio] = (servicioCount[c.servicio] || 0) + 1;
      const fecha = String(c.fecha).substring(0, 10);
      diaCount[fecha] = (diaCount[fecha] || 0) + 1;
    });

    const topServicioArr = Object.entries(servicioCount).sort((a, b) => b[1] - a[1]);
    const topDiaArr      = Object.entries(diaCount).sort((a, b) => b[1] - a[1]);

    return {
      total: citas.length,
      ingresos,
      topServicio: topServicioArr.length ? topServicioArr[0][0] : '—',
      topDia: topDiaArr.length ? formatDiaLabel(topDiaArr[0][0]) : '—',
      servicioCount
    };
  }

  function renderMetricCards(m, fi, ff) {
    document.getElementById('metricsGrid').innerHTML = `
      <div class="metric-card">
        <div class="metric-card__value">${m.total}</div>
        <div class="metric-card__label">Citas confirmadas</div>
      </div>
      <div class="metric-card metric-card--gold">
        <div class="metric-card__value">${formatPeso(m.ingresos)}</div>
        <div class="metric-card__label">Ingresos estimados</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__value metric-card__value--sm">${escapeHtml(m.topServicio)}</div>
        <div class="metric-card__label">Servicio más vendido</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__value metric-card__value--sm">${escapeHtml(m.topDia)}</div>
        <div class="metric-card__label">Día más concurrido</div>
      </div>
    `;
  }

  function renderWeekChart(citas, fechaInicio, fechaFin) {
    const chart = document.getElementById('weekChart');
    const label = document.getElementById('chartLabel');

    // Build days in range (max 7 for legibility; if range > 7, aggregate by day-of-week)
    const start  = new Date(fechaInicio + 'T00:00:00');
    const end    = new Date(fechaFin    + 'T00:00:00');
    const diffMs = end - start;
    const diffDays = Math.round(diffMs / 86400000) + 1;

    if (diffDays <= 31) {
      // Show each day as its own bar
      const days = [];
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = formatDateStr(d);
        const shortLabel = diffDays <= 7
          ? ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()]
          : String(d.getDate());
        days.push({ dateStr, label: shortLabel, count: 0 });
      }
      citas.forEach(c => {
        const fecha = String(c.fecha).substring(0, 10);
        const day = days.find(d => d.dateStr === fecha);
        if (day) day.count++;
      });
      label.textContent = `Citas por día (${fechaInicio} → ${fechaFin})`;
      renderBars(days, chart);
    } else {
      // Aggregate by day of week
      const dows = [
        { label: 'Lun', count: 0 }, { label: 'Mar', count: 0 },
        { label: 'Mié', count: 0 }, { label: 'Jue', count: 0 },
        { label: 'Vie', count: 0 }, { label: 'Sáb', count: 0 },
        { label: 'Dom', count: 0 }
      ];
      citas.forEach(c => {
        const fecha = String(c.fecha).substring(0, 10);
        const parts = fecha.split('-');
        const d     = new Date(parts[0], parts[1] - 1, parts[2]);
        // getDay: 0=Dom,1=Lun...6=Sab → reorder to Lun=0
        const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        dows[idx].count++;
      });
      label.textContent = 'Citas por día de la semana (período seleccionado)';
      renderBars(dows, chart);
    }
  }

  function renderBars(days, chart) {
    const maxCount = Math.max(...days.map(d => d.count), 1);
    const today    = formatDateStr(new Date());
    chart.innerHTML = days.map(d => {
      const pct      = Math.round((d.count / maxCount) * 100);
      const isToday  = d.dateStr === today;
      return `
        <div class="week-chart__col ${isToday ? 'week-chart__col--today' : ''}">
          <div class="week-chart__bar-wrap">
            <div class="week-chart__bar" style="height:${pct || 2}%"></div>
          </div>
          <div class="week-chart__count">${d.count}</div>
          <div class="week-chart__day">${d.label}</div>
        </div>
      `;
    }).join('');
  }

  function renderServicesRank(servicioCount) {
    const rank    = document.getElementById('servicesRank');
    const sorted  = Object.entries(servicioCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (sorted.length === 0) { rank.innerHTML = ''; return; }
    const max = sorted[0][1];
    rank.innerHTML = `
      <div class="rank-title">Servicios vendidos</div>
      ${sorted.map(([nombre, count]) => `
        <div class="rank-row">
          <div class="rank-name">${escapeHtml(nombre)}</div>
          <div class="rank-bar-wrap">
            <div class="rank-bar" style="width:${Math.round(count / max * 100)}%"></div>
          </div>
          <div class="rank-count">${count}</div>
        </div>
      `).join('')}
    `;
  }

  // ========== BLOQUEAR DÍA ==========
  document.getElementById('btnBloquear').addEventListener('click', async () => {
    const fecha   = document.getElementById('blockDate').value;
    const barbero = document.getElementById('blockBarbero').value;
    const motivo  = document.getElementById('blockMotivo').value.trim();
    if (!fecha) { showToast('Selecciona una fecha', 'error'); return; }
    try {
      await API.bloquearDia({ fecha, barbero, motivo });
      showToast('Día bloqueado exitosamente', 'success');
      document.getElementById('blockDate').value   = '';
      document.getElementById('blockMotivo').value = '';
      loadDiasBloqueados();
    } catch { showToast('Error al bloquear día', 'error'); }
  });

  // ========== DÍAS BLOQUEADOS ==========
  async function loadDiasBloqueados() {
    document.getElementById('diasLoading').style.display = 'block';
    document.getElementById('diasList').innerHTML = '';
    try {
      const data = await API.getDiasBloqueados();
      const todos = (data.diasBloqueados || []);
      document.getElementById('diasLoading').style.display = 'none';
      renderDiasBloqueados(todos);
    } catch {
      document.getElementById('diasLoading').style.display = 'none';
    }
  }

  function renderDiasBloqueados(todos) {
    const list   = document.getElementById('diasList');
    const today  = formatToday();
    const futuros = todos.filter(d => d.fecha >= today).sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (futuros.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-state__icon">🔓</div>
        <p class="empty-state__text">No hay días bloqueados próximos.</p>
      </div>`;
      return;
    }

    list.innerHTML = futuros.map(dia => {
      const parts   = dia.fecha.split('-');
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const fechaStr = `${CONFIG.DIAS_SEMANA[dateObj.getDay()]} ${parts[2]}/${parts[1]}/${parts[0]}`;
      return `
        <div class="blocked-day">
          <div class="blocked-day__info">
            <div class="blocked-day__date">${fechaStr}</div>
            <div class="blocked-day__barbero">${escapeHtml(dia.barbero)}</div>
            ${dia.motivo ? `<div class="blocked-day__motivo">${escapeHtml(dia.motivo)}</div>` : ''}
          </div>
          <button class="btn btn--danger btn--small" onclick="desbloquearDia('${dia.fecha}','${dia.barbero}')">Desbloquear</button>
        </div>
      `;
    }).join('');
  }

  window.desbloquearDia = async function(fecha, barbero) {
    if (!confirm('¿Desbloquear este día?')) return;
    try {
      await API.desbloquearDia({ fecha, barbero });
      showToast('Día desbloqueado', 'success');
      loadDiasBloqueados();
    } catch { showToast('Error al desbloquear', 'error'); }
  };

  // ========== HELPERS ==========
  function buildPrecioMap() {
    const map = {};
    [...CONFIG.SERVICIOS.caballeros, ...CONFIG.SERVICIOS.damas].forEach(s => {
      map[s.nombre] = parsePrecio(s.precio);
    });
    return map;
  }

  function parsePrecio(str) {
    const m = String(str || '').match(/\$(\d+)k/);
    return m ? parseInt(m[1]) * 1000 : 0;
  }

  function formatPeso(n) {
    if (!n) return '$0';
    return '$' + n.toLocaleString('es-CO');
  }

  function getCurrentWeekRange() {
    const today = new Date();
    const dow   = today.getDay();
    const diff  = dow === 0 ? -6 : 1 - dow;
    const mon   = new Date(today); mon.setDate(today.getDate() + diff);
    const sun   = new Date(mon);   sun.setDate(mon.getDate() + 6);
    return { inicio: formatDateStr(mon), fin: formatDateStr(sun) };
  }

  function formatDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatToday() { return formatDateStr(new Date()); }

  function formatHora(val) {
    if (!val) return '';
    const str = String(val);
    if (str.includes('T') || str.includes('GMT')) {
      try { const d = new Date(str); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); } catch {}
    }
    return str.length <= 5 ? str : str.substring(0, 5);
  }

  function formatDiaLabel(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return CONFIG.DIAS_SEMANA[d.getDay()] + ' ' + parts[2] + '/' + parts[1];
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  }

  function formatFechaDisplay(fechaStr) {
    if (!fechaStr) return '';
    const parts = String(fechaStr).split('-');
    if (parts.length < 3) return fechaStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return `${CONFIG.DIAS_SEMANA[d.getDay()]} ${parts[2]}/${parts[1]}/${parts[0]}`;
  }
});
