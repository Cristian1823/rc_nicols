/**
 * BarberShop Elite - Backend (Google Apps Script)
 *
 * Desplegar como Web App:
 * 1. Crear nuevo proyecto en Google Apps Script
 * 2. Pegar este código
 * 3. Crear un Google Sheet y copiar su ID en SPREADSHEET_ID
 * 4. Crear las hojas ejecutando setup(): Citas, DiasBloquados, Config, Servicios, Barberos
 * 5. En Config, agregar fila: clave="PIN", valor="1234"
 * 6. Desplegar > Nueva implementación > App web
 * 7. Acceso: "Cualquier persona"
 * 8. Copiar la URL y pegarla en js/config.js
 */

const SPREADSHEET_ID = '1g7AojBh46vB-0YBIARtkWGnlK1QLDbi8T5l28_TGnFo';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ========== OUTPUT HELPERS ==========
function createOutput(data, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== GET HANDLER (todas las acciones via GET + JSONP) ==========
function doGet(e) {
  const p = e.parameter;
  const action = p.action;
  const callback = p.callback;

  try {
    var result;
    switch (action) {
      case 'getSlots':
        result = getSlots(p.fecha, p.barbero); break;
      case 'getCitas':
        result = getCitas(p.fecha); break;
      case 'getDiasBloqueados':
        result = getDiasBloqueados(); break;
      case 'reservar':
        result = reservar(p); break;
      case 'cancelarCita':
        result = cancelarCita(p.id); break;
      case 'bloquearDia':
        result = bloquearDia(p); break;
      case 'desbloquearDia':
        result = desbloquearDia(p); break;
      case 'verificarPin':
        result = verificarPin(p.pin); break;
      case 'getServicios':
        result = getServicios(p.genero); break;
      case 'getBarberos':
        result = getBarberos(p.genero); break;
      case 'getCitasRango':
        result = getCitasRango(p.fechaInicio, p.fechaFin); break;
      default:
        result = { error: 'Acción no válida' };
    }
    return createOutput(result, callback);
  } catch (err) {
    return createOutput({ error: err.message }, callback);
  }
}

// ========== POST HANDLER (respaldo) ==========
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonOutput({ error: 'Datos inválidos' });
  }

  try {
    switch (data.action) {
      case 'reservar':
        return createJsonOutput(reservar(data));
      case 'cancelarCita':
        return createJsonOutput(cancelarCita(data.id));
      case 'bloquearDia':
        return createJsonOutput(bloquearDia(data));
      case 'desbloquearDia':
        return createJsonOutput(desbloquearDia(data));
      case 'verificarPin':
        return createJsonOutput(verificarPin(data.pin));
      default:
        return createJsonOutput({ error: 'Acción no válida' });
    }
  } catch (err) {
    return createJsonOutput({ error: err.message });
  }
}

// ========== GET SLOTS ==========
// Devuelve los bloques ocupados {hora, horaFin} para que el frontend calcule solapamientos
function getSlots(fecha, barbero) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Citas');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const fechaIdx   = headers.indexOf('fecha');
  const horaIdx    = headers.indexOf('hora');
  const horaFinIdx = headers.indexOf('horaFin');
  const barberoIdx = headers.indexOf('barbero');
  const estadoIdx  = headers.indexOf('estado');

  const ocupados = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowFecha = formatSheetDate(row[fechaIdx]);
    if (rowFecha === fecha && row[barberoIdx] === barbero && row[estadoIdx] !== 'cancelada') {
      ocupados.push({
        hora:    formatSheetTime(row[horaIdx]),
        horaFin: formatSheetTime(row[horaFinIdx])
      });
    }
  }

  return { ocupados: ocupados };
}

// ========== GET CITAS ==========
function getCitas(fecha) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Citas');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const citas = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowFecha = formatSheetDate(row[headers.indexOf('fecha')]);
    if (rowFecha === fecha) {
      const cita = {};
      headers.forEach((h, j) => {
        if (h === 'fecha') {
          cita[h] = rowFecha;
        } else if (h === 'hora' || h === 'horaFin') {
          cita[h] = formatSheetTime(row[j]);
        } else {
          cita[h] = row[j];
        }
      });
      citas.push(cita);
    }
  }

  return { citas: citas };
}

// ========== GET DÍAS BLOQUEADOS ==========
function getDiasBloqueados() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('DiasBloquados');
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return { diasBloqueados: [] };

  const headers = data[0];
  const horasIdx = headers.indexOf('horas');

  const dias = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dia = {};
    headers.forEach((h, j) => {
      if (h === 'fecha') {
        dia[h] = formatSheetDate(row[j]);
      } else if (h === 'horas') {
        // Sheets puede auto-convertir "09:00" a Date si hay una sola hora
        var val = row[j];
        if (val instanceof Date) {
          dia[h] = formatSheetTime(val);
        } else {
          dia[h] = String(val || '');
        }
      } else {
        dia[h] = row[j];
      }
    });

    // Si la columna 'horas' no tiene encabezado (columna D sin nombre),
    // leerla directamente por posición (índice 3)
    if (horasIdx === -1 && dia.horas === undefined) {
      var horasVal = row.length > 3 ? row[3] : '';
      if (horasVal instanceof Date) {
        dia.horas = formatSheetTime(horasVal);
      } else {
        dia.horas = String(horasVal || '');
      }
    }

    dias.push(dia);
  }

  return { diasBloqueados: dias };
}

// ========== RESERVAR ==========
function reservar(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Citas');

  const existing = sheet.getDataRange().getValues();
  const headers  = existing[0];
  const fechaIdx   = headers.indexOf('fecha');
  const horaIdx    = headers.indexOf('hora');
  const horaFinIdx = headers.indexOf('horaFin');
  const barberoIdx = headers.indexOf('barbero');
  const estadoIdx  = headers.indexOf('estado');

  function timeToMin(t) {
    if (!t) return 0;
    var parts = String(t).split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
  }

  var esSinHora = (data.hora === 'A coordinar');

  var nuevoInicio = timeToMin(data.hora);
  var nuevoFin    = timeToMin(data.horaFin);

  // Verificar que el día/hora no esté bloqueado por el admin
  if (!esSinHora) {
    var diasSheet   = ss.getSheetByName('DiasBloquados');
    var diasData    = diasSheet.getDataRange().getValues();
    var diasHeaders = diasData[0];
    var dFechaIdx   = diasHeaders.indexOf('fecha');
    var dBarberoIdx = diasHeaders.indexOf('barbero');
    var dHorasIdx   = diasHeaders.indexOf('horas');

    for (var j = 1; j < diasData.length; j++) {
      var dRow    = diasData[j];
      var dFecha  = formatSheetDate(dRow[dFechaIdx]);
      if (dFecha !== data.fecha) continue;
      var dBarb   = dRow[dBarberoIdx];
      if (dBarb !== data.barbero && dBarb !== 'Todos') continue;
      // Si no hay columna 'horas' en el encabezado, leer columna D (índice 3) directamente
      var dHorasRaw = dHorasIdx >= 0 ? dRow[dHorasIdx] : (dRow.length > 3 ? dRow[3] : '');
      var dHoras = dHorasRaw instanceof Date ? formatSheetTime(dHorasRaw) : String(dHorasRaw || '');
      if (!dHoras) {
        return { error: 'Este día está bloqueado' };
      }
      // Bloqueo parcial: verificar solapamiento con [nuevoInicio, nuevoFin)
      var blockedList = dHoras.split(',');
      for (var k = 0; k < blockedList.length; k++) {
        var btMin = timeToMin(blockedList[k].trim());
        if (nuevoInicio < btMin + 45 && nuevoFin > btMin) {
          return { error: 'Este horario está bloqueado' };
        }
      }
    }
  }

  // Verificar solapamiento con citas existentes (solo si tiene hora definida)
  for (var i = 1; i < existing.length && !esSinHora; i++) {
    var row = existing[i];
    var rowFecha = formatSheetDate(row[fechaIdx]);
    if (rowFecha !== data.fecha || row[barberoIdx] !== data.barbero || row[estadoIdx] === 'cancelada') continue;

    var existInicio = timeToMin(formatSheetTime(row[horaIdx]));
    var existFin    = timeToMin(formatSheetTime(row[horaFinIdx]));

    if (nuevoInicio < existFin && nuevoFin > existInicio) {
      return { error: 'Este horario ya está ocupado' };
    }
  }

  var id = Utilities.getUuid();
  sheet.appendRow([
    id,
    data.fecha,
    data.hora,
    data.horaFin,
    data.barbero,
    data.servicio,
    data.cliente,
    data.telefono,
    'confirmada'
  ]);

  return { success: true, id: id };
}

// ========== CANCELAR CITA ==========
function cancelarCita(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Citas');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const estadoIdx = headers.indexOf('estado');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === id) {
      sheet.getRange(i + 1, estadoIdx + 1).setValue('cancelada');
      return { success: true };
    }
  }

  return { error: 'Cita no encontrada' };
}

// ========== BLOQUEAR DÍA ==========
function bloquearDia(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('DiasBloquados');

  sheet.appendRow([
    data.fecha,
    data.barbero,
    data.motivo || '',
    data.horas || ''
  ]);

  return { success: true };
}

// ========== DESBLOQUEAR DÍA ==========
function desbloquearDia(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('DiasBloquados');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const fechaIdx  = headers.indexOf('fecha');
  const barberoIdx = headers.indexOf('barbero');
  const horasIdx  = headers.indexOf('horas');

  const horasParam = data.horas || '';

  for (let i = rows.length - 1; i >= 1; i--) {
    const rowFecha  = formatSheetDate(rows[i][fechaIdx]);
    const rowHoras  = horasIdx >= 0 ? (rows[i][horasIdx] || '') : '';
    if (rowFecha === data.fecha && rows[i][barberoIdx] === data.barbero && rowHoras === horasParam) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: 'Registro no encontrado' };
}

// ========== GET SERVICIOS ==========
function getServicios(genero) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Servicios');
  if (!sheet) return { servicios: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0]; // genero, id, nombre, precio, duracion, sinHora
  const generoIdx  = headers.indexOf('genero');
  const idIdx      = headers.indexOf('id');
  const nombreIdx  = headers.indexOf('nombre');
  const precioIdx  = headers.indexOf('precio');
  const duracionIdx= headers.indexOf('duracion');
  const sinHoraIdx = headers.indexOf('sinHora');

  const servicios = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!genero || row[generoIdx] === genero) {
      const svc = {
        id:      row[idIdx],
        nombre:  row[nombreIdx],
        precio:  row[precioIdx],
        duracion: row[duracionIdx] === '' || row[duracionIdx] === null ? null : Number(row[duracionIdx])
      };
      if (sinHoraIdx !== -1 && row[sinHoraIdx] === true) {
        svc.sinHora = true;
      }
      servicios.push(svc);
    }
  }

  return { servicios: servicios };
}

// ========== GET BARBEROS ==========
function getBarberos(genero) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Barberos');
  if (!sheet) return { barberos: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0]; // genero, nombre
  const generoIdx = headers.indexOf('genero');
  const nombreIdx = headers.indexOf('nombre');

  const barberos = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!genero || row[generoIdx] === genero) {
      barberos.push(row[nombreIdx]);
    }
  }

  return { barberos: barberos };
}

// ========== GET CITAS RANGO ==========
function getCitasRango(fechaInicio, fechaFin) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Citas');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const citas = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowFecha = formatSheetDate(row[headers.indexOf('fecha')]);
    if (rowFecha < fechaInicio || rowFecha > fechaFin) continue;
    if (row[headers.indexOf('estado')] === 'cancelada') continue;
    const cita = {};
    headers.forEach((h, j) => {
      if (h === 'fecha') cita[h] = rowFecha;
      else if (h === 'hora' || h === 'horaFin') cita[h] = formatSheetTime(row[j]);
      else cita[h] = row[j];
    });
    citas.push(cita);
  }
  return { citas };
}

// ========== VERIFICAR PIN ==========
function verificarPin(pin) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'PIN' && String(data[i][1]) === String(pin)) {
      return { valid: true };
    }
  }

  return { valid: false };
}

// ========== HELPERS ==========
function formatSheetDate(value) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(value);
}

function formatSheetTime(value) {
  if (value instanceof Date) {
    return String(value.getHours()).padStart(2, '0') + ':' + String(value.getMinutes()).padStart(2, '0');
  }
  return String(value);
}

// ========== SETUP (ejecutar una vez) ==========
function setup() {
  const ss = getSpreadsheet();

  // Crear hoja Citas si no existe
  if (!ss.getSheetByName('Citas')) {
    const citasSheet = ss.insertSheet('Citas');
    citasSheet.appendRow(['id', 'fecha', 'hora', 'horaFin', 'barbero', 'servicio', 'cliente', 'telefono', 'estado']);
  }

  // Crear hoja DiasBloquados si no existe
  if (!ss.getSheetByName('DiasBloquados')) {
    const diasSheet = ss.insertSheet('DiasBloquados');
    diasSheet.appendRow(['fecha', 'barbero', 'motivo']);
  }

  // Crear hoja Config si no existe
  if (!ss.getSheetByName('Config')) {
    const configSheet = ss.insertSheet('Config');
    configSheet.appendRow(['clave', 'valor']);
    configSheet.appendRow(['PIN', '1234']);
  }

  // Crear hoja Servicios si no existe
  if (!ss.getSheetByName('Servicios')) {
    const svcSheet = ss.insertSheet('Servicios');
    svcSheet.appendRow(['genero', 'id', 'nombre', 'precio', 'duracion']);
    // Caballeros
    svcSheet.appendRow(['caballeros', 'corte_caballero', 'Corte Caballero',  '$18k', 45]);
    svcSheet.appendRow(['caballeros', 'corte_ninos',     'Corte Niños',      '$16k', 45]);
    svcSheet.appendRow(['caballeros', 'barba',           'Barba',             '$8k',  20]);
    svcSheet.appendRow(['caballeros', 'corte_barba',     'Corte + Barba',     '$25k', 60]);
    svcSheet.appendRow(['caballeros', 'cejas_c',         'Cejas',             '$3k',  10]);
    svcSheet.appendRow(['caballeros', 'lavado',          'Lavado',            '$2k',  10]);
    // Damas
    svcSheet.appendRow(['damas', 'manicure',          'Manicure Tradicional',  '$15k',       30]);
    svcSheet.appendRow(['damas', 'pedicure',          'Pedicure Tradicional',  '$20k',       40]);
    svcSheet.appendRow(['damas', 'semi_mano',         'Semipermanente Mano',   '$50k',       60]);
    svcSheet.appendRow(['damas', 'semi_pies',         'Semipermanente Pies',   '$45k',       60]);
    svcSheet.appendRow(['damas', 'bano_poligel',      'Baño Poligel',          '$70k',      120]);
    svcSheet.appendRow(['damas', 'unas_poligel',      'Uñas Poligel',          '$100k',     180]);
    svcSheet.appendRow(['damas', 'acrilicas',         'Acrílicas',             '$100k',     180]);
    svcSheet.appendRow(['damas', 'press_on',          'Press-on',              '$85k',      120]);
    svcSheet.appendRow(['damas', 'mantenimiento',     'Mantenimiento',         'Desde $60k',120]);
    svcSheet.appendRow(['damas', 'corte_dama',        'Corte Dama',            '$14k',       30]);
    svcSheet.appendRow(['damas', 'depilacion_ceja',   'Depilación Ceja',       '$9k',        10]);
    svcSheet.appendRow(['damas', 'depilacion_bigote', 'Depilación Bigote',     '$6k',        10]);
    svcSheet.appendRow(['damas', 'depilacion_axila',  'Depilación Axila',      '$12k',       20]);
  }

  // Crear hoja Barberos si no existe
  if (!ss.getSheetByName('Barberos')) {
    const barSheet = ss.insertSheet('Barberos');
    barSheet.appendRow(['genero', 'nombre']);
    barSheet.appendRow(['caballeros', 'Sebastián']);
    barSheet.appendRow(['caballeros', 'César']);
    barSheet.appendRow(['damas', 'Rocío']);
  }

  Logger.log('Setup completado. Hojas creadas.');
}
