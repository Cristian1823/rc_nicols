# RC Barber & Spa / RC Nicoll's - Sistema de Agendamiento

## Estructura
```
index.html              → Interfaz cliente (landing género + 6 pasos de reserva)
admin.html              → Panel admin (PIN login, gestión citas, bloqueo días)
css/styles.css          → Estilos base + tema Caballeros (oscuro/dorado) + tema Damas (blanco/lila)
js/config.js            → Configuración (barberos, servicios, horario, API URL, WSP)
js/api.js               → Comunicación con backend via JSONP
js/app.js               → Lógica del cliente (selección género, calendario, slots, reservas)
js/admin.js             → Lógica admin (PIN, citas, bloquear días, métricas, citas extraordinarias)
google-apps-script/Code.gs → Backend Google Apps Script
Logos/
  Logo Caballeros.jpeg  → Logo RC Barber & Spa (letras crema sobre negro)
  Logo Damas.jpeg       → Logo RC Nicoll's (círculo morado sobre negro)  ← D mayúscula (Cloudflare/Linux es case-sensitive)
  fondo.png             → Ilustración barbería (RGBA con transparencia, disponible para uso futuro)
Sebastian.jpeg          → Foto de Sebastián (barbero) — usada en card de especialista
Cesar.jpeg              → Foto de César (barbero) — usada en card de especialista
Rocio.jpeg              → Foto de Rocío (estilista) — usada en card de especialista
qr_rc_barber.png        → QR code para https://rc-nicols.pages.dev (fondo oscuro, módulos dorados, logo centrado 35%)
```

## Stack
- Frontend: HTML/CSS/JS vanilla (sin frameworks) + Anime.js v3.2.1 (animaciones de iconos)
- Backend: Google Apps Script desplegado como Web App
- Base de datos: Google Sheets (hojas: Citas, DiasBloquados, Config, Servicios, Barberos)
- Comunicación: JSONP (evita problemas de CORS con Google Apps Script)
- Deploy: Cloudflare Pages → https://rc-nicols.pages.dev
- Admin: https://rc-nicols.pages.dev/admin.html (acceso directo, sin link desde index)

## Configuración
- Especialistas: Sebastián (caballeros), César (caballeros), Rocío (damas)
- Horario: todos los días (incluyendo domingo), 9:00 - 21:00; días cerrados solo vía bloqueo admin
- Slots caballeros: fijos cada 45 min → 09:00, 09:45, 10:30, 11:15, 12:00, 12:45, 13:30, 14:15, 15:00, 15:45, 16:30, 17:15, 18:00, 18:45, 19:30, 20:15, 21:00
- Slots damas: dinámicos según duración del servicio (slotBase 10 min en CONFIG.HORARIO)
- Servicios: cargados desde Google Sheets (Servicios sheet); fallback en CONFIG.SERVICIOS
- PIN admin por defecto: 1234 (hoja Config en Google Sheets)
- WhatsApp (CONFIG.WSP): César 573108048028, Sebastián 573025441491, Rocío 573213017130

## Flujo del cliente
1. **Landing de género** (`#genderLanding`): pantalla fullscreen fija con dos tarjetas
   - Sin texto de marca en el header — solo la tagline "¿Para quién es el servicio?"
   - Caballeros → aplica tema oscuro/dorado (default)
   - Damas → aplica tema claro blanco/lila (body.theme-damas)
2. **Pasos de reserva** dentro de `#mainApp` (oculto hasta seleccionar género):
   - Flujo normal: Servicio → Especialista → Fecha → Hora → Datos → Confirmación
   - Flujo sinHora: Servicio → Especialista → Fecha → Datos → Confirmación (sin paso de hora)
3. Botón "← Cambiar" en el header vuelve al landing de género
4. "Agendar otro turno" también regresa al landing de género

## Servicios sin hora (sinHora: true)
Keratina, Células Madre, Alisado, Cepillado — servicios damas con precio "A convenir" y sin duración fija.
- El cliente elige día pero NO hora (la coordina con Rocío por WhatsApp)
- Se guarda en Sheets con hora = "A coordinar"
- Confirmación muestra botón WSP destacado: "¡Coordina tu hora con Rocío!"
- En Code.gs: `reservar` omite validación de conflicto cuando hora = "A coordinar"
- En Sheets (hoja Servicios): columna `sinHora = TRUE` para estos 4 servicios; duracion vacía
- `getServicios` en Code.gs devuelve `sinHora: true` si está marcado en Sheets
- En app.js: `BARBERO_FOTOS` mapea nombre → archivo; fallback al SVG via addEventListener('error')

## Temas visuales
### Tema Caballeros (default)
- Fondo oscuro #1a1a1a con gradiente radial sutil, tarjetas #252525
- Acento dorado #c8a96e / #d4af37
- Fuentes: Playfair Display (títulos con gradiente dorado sutil) + Montserrat (cuerpo)

### Tema Damas (body.theme-damas)
- Fondo blanco-lavanda #f8f4ff, tarjetas blancas #ffffff
- Acento violeta #8b5cf6 (violet-500), hover #6d28d9
- Texto morado oscuro #1e0750 / #3b1177
- Botones: gradiente indigo → violet con texto blanco
- Todos los elementos se adaptan mediante sobreescritura de variables CSS --gold, --bg-*, --text-*

### Landing cards (diseño actual)
- Sin texto "BarberShop Elite" — el header solo muestra la tagline
- Blobs de color flotantes (::after con filter blur 60px, animación blobDrift):
  - Caballeros: blob dorado/ámbar esquina inferior-derecha
  - Damas: blob fucsia/lila esquina superior-izquierda
- Glassmorphism en franja inferior: backdrop-filter blur(16px) con fondo semitransparente
- Gradientes dobles en fondos (dos radial-gradients en diagonal para profundidad)
- Desktop mayor a 700px: layout lado a lado (flex-direction: row)
- Caballeros: gradiente cálido oscuro + glow dorado animado (logoPulse)
- Damas: gradiente violeta vivo (#5b21b6 → negro) + glow blanco-lila animado
- Logo del header: 110px rectángulo redondeado, object-fit: contain
  - Damas: fondo oscuro #2d1060 para que el JPEG (logo sobre negro) se vea correctamente

### Interior (pasos de reserva)
- Strip de ilustraciones SVG temáticas (.step-ilus) en step 1, antes de las opciones:
  - Caballeros: tijeras, poste de barbería, peine, bigote, navaja
  - Damas: secador, tijeras, pincel, estrella, espejo
  - Se muestra/oculta con body.theme-damas .step-ilus__caballeros { display:none }
- Option cards de servicios con iconos SVG inline (usan currentColor → heredan el tema)
- Cards de especialistas (step 2):
  - Foto circular 110px: Sebastián (Sebastian.jpeg, object-position: center top), César (Cesar.jpeg, object-position: 50% 18%) y Rocío (Rocio.jpeg)
  - Fallback al SVG_PERSON vía addEventListener('error') en JS (nunca onerror inline — rompe el HTML)
  - Descripción dinámica: "Barbero Profesional" (caballeros) / "Estilista Profesional" (damas)
  - Cards con padding 20px, min-height 120px, foto centrada
  - Card seleccionada: borde dorado/violeta + glow en la foto
- Títulos de pasos: gradiente dorado sutil en caballeros (blanco → dorado)
- Confirmation icon: encerrado en círculo con borde dorado y glow
- WSP card destacada (.wsp-card--destacado): borde 2px violeta + glow para servicios sinHora

## Decisiones técnicas
- JSONP en vez de fetch: Google Apps Script bloquea CORS desde localhost/Live Server.
- Todo via GET: las operaciones POST también van por doGet con parámetros URL.
- formatSheetTime/formatSheetDate: Google Sheets convierte strings de hora/fecha a objetos Date. Siempre formatear antes de comparar.
- Selección de género es 100% frontend: el backend recibe los mismos campos sin importar el género elegido.
- Variables CSS (--gold, --bg-*, --text-*) permiten cambiar el tema completo con una sola clase en body.
- Los logos tienen fondo negro en el JPEG → usar object-fit: contain (no cover).
- SVG icons inline en option cards: usan currentColor → heredan el color del tema automáticamente.
- fondo.png fue procesado con Pillow para tener canal alpha real (RGBA, 76.8% transparente). No necesita mix-blend-mode.
- Cloudflare Pages corre en Linux: todos los paths a assets deben coincidir exactamente en mayúsculas/minúsculas.
- Header logo src inicial = "Logos/Logo Caballeros.jpeg" (no vacío) para evitar bug de iOS Safari que ignora cambios de src en img sin src.
- iOS Safari: font-size ≥16px en inputs para evitar zoom automático; env(safe-area-inset-bottom) para notch en toast/wsp-notify.
- Admin métricas: sin filtro por área ni ranking de servicios (privacidad entre especialistas); solo totales generales + gráfico por día.
- Citas extraordinarias: reutilizan API.reservar sin restricción de horario; conflictos validados server-side.
- Confirmación de reserva incluye tarjeta WhatsApp dinámica con link wa.me/ al especialista elegido.
- sinHora: flag en CONFIG.SERVICIOS y en hoja Servicios de Sheets; controla si se salta el paso de hora.
- Horarios en formato 12h (AM/PM) para el cliente: función `to12h(timeStr)` en app.js convierte el display de slots, resumen y confirmación. La lógica interna y el backend siguen usando formato 24h (`HH:MM`).

## Para conectar el backend
1. Crear Google Sheet → copiar ID en Code.gs (SPREADSHEET_ID)
2. Ejecutar setup() en Apps Script para crear hojas (Citas, DiasBloquados, Config, Servicios, Barberos)
3. Agregar columna `sinHora` en hoja Servicios y las 4 filas de servicios sin hora
4. Agregar columna `horas` en hoja DiasBloquados (después de `motivo`)
5. Desplegar como Web App (acceso: cualquier persona)
6. Pegar URL en js/config.js (API_URL)

## Para actualizar el backend
1. Pegar código nuevo en Apps Script
2. Implementar > Administrar implementaciones > lápiz > Versión: "Nueva versión" > Implementar
3. La URL se mantiene igual

## Admin panel (admin.html)
- Acceso solo por URL directa: https://rc-nicols.pages.dev/admin.html
- PIN almacenado en hoja Config de Google Sheets (por defecto 1234)
- Secciones: Métricas/ventas, Citas del día (tabs por especialista), Bloquear día, Días bloqueados, Citas extraordinarias
- Al cancelar cita: opción opcional de enviar WhatsApp al cliente (#wspNotify flotante)
- Métricas: filtro por rango de fechas (sin filtro por área); gráfico de barras semanal o por día-de-semana (>31 días); sin ranking de servicios por especialista (privacidad)

### Bloqueo de días y horas
- El admin puede bloquear **todo el día** o **horas específicas** (toggle radio en el formulario)
- Horas específicas: grid de checkboxes con los mismos slots fijos (09:00 → 21:00, cada 45 min); se almacenan como CSV en columna `horas`
- Hoja `DiasBloquados` columnas: `fecha | barbero | motivo | horas` (horas vacío = todo el día)
- `isDiaBlocked` en app.js: solo bloquea el día en el calendario cuando `horas` está vacío
- `isSlotBlocked` en app.js: deshabilita slots que solapan con las horas bloqueadas (ventana de 45 min por hora bloqueada); usa `String(d.horas)` defensivo
- `reservar` en Code.gs valida contra bloqueos de día completo y parciales antes de guardar (ventana 45 min)
- `desbloquearDia` identifica la fila por `fecha + barbero + horas` (permite múltiples bloqueos parciales en el mismo día)
- `getDiasBloqueados` y `reservar` en Code.gs leen la columna `horas` por posición (índice 3) si no tiene encabezado, y aplican `formatSheetTime` si Sheets la auto-convirtió a Date
- **Columna `horas` en hoja DiasBloquados**: agregar header "horas" en celda D1 (el código funciona sin él, pero es buena práctica)

## QR Code
- Archivo: qr_rc_barber.png (574×574px)
- URL: https://rc-nicols.pages.dev
- Generado con Python (qrcode + Pillow): fondo #1a1a1a, módulos dorados (200,169,110)
- Logo Caballeros centrado al 35% del tamaño del QR; ERROR_CORRECT_H para tolerancia con logo overlay
- Para regenerar: ejecutar script Python con qrcode y Pillow instalados
