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
  Logo Damas.jpeg       → Logo RC Nicoll's (círculo morado sobre negro)  ← D mayúscula (GitHub Pages es case-sensitive)
  fondo.png             → Ilustración barbería (RGBA con transparencia, disponible para uso futuro)
qr_rc_barber.png        → QR code para https://cristian1823.github.io/rc_nicols/ (fondo oscuro, módulos dorados, logo centrado 35%)
```

## Stack
- Frontend: HTML/CSS/JS vanilla (sin frameworks) + Anime.js v3.2.1 (animaciones de iconos)
- Backend: Google Apps Script desplegado como Web App
- Base de datos: Google Sheets (hojas: Citas, DiasBloquados, Config, Servicios, Barberos)
- Comunicación: JSONP (evita problemas de CORS con Google Apps Script)
- Deploy: Cloudflare Pages → https://rc-nicols.pages.dev

## Configuración
- Especialistas: Sebastián (caballeros), César (caballeros), Rocío (damas)
- Horario: Lunes a Sábado, 9:00 - 21:00 (domingos cerrado), slotBase 10 min
- Servicios: cargados desde Google Sheets (Servicios sheet); fallback en CONFIG.SERVICIOS
- PIN admin por defecto: 1234 (hoja Config en Google Sheets)
- WhatsApp (CONFIG.WSP): César 573108048028, Sebastián 573025441491, Rocío 573213017130

## Flujo del cliente
1. **Landing de género** (`#genderLanding`): pantalla fullscreen fija con dos tarjetas
   - Sin texto de marca en el header — solo la tagline "¿Para quién es el servicio?"
   - Caballeros → aplica tema oscuro/dorado (default)
   - Damas → aplica tema claro blanco/lila (body.theme-damas)
2. **6 pasos de reserva** dentro de `#mainApp` (oculto hasta seleccionar género):
   Servicio → Especialista → Fecha → Hora → Datos → Confirmación
3. Botón "← Cambiar" en el header vuelve al landing de género
4. "Agendar otro turno" también regresa al landing de género

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
- Option cards con iconos SVG inline (reemplazan emojis):
  - corte_barba: tijeras + silueta de barba
  - solo_corte: tijeras con punto central
  - barberos (Sebastián/César/Rocío): silueta de persona + mini-tijeras badge
  - Contenedor icono: fondo con borde dorado/violeta, se ilumina al seleccionar
  - Card seleccionada tiene línea de acento vertical izquierda (::before)
  - Iconos animados con Anime.js: float suave (translateY 0→-5px) con delay escalonado por índice
- Títulos de pasos: gradiente dorado sutil en caballeros (blanco → dorado)
- Confirmation icon: encerrado en círculo con borde dorado y glow

## Decisiones técnicas
- JSONP en vez de fetch: Google Apps Script bloquea CORS desde localhost/Live Server.
- Todo via GET: las operaciones POST también van por doGet con parámetros URL.
- formatSheetTime/formatSheetDate: Google Sheets convierte strings de hora/fecha a objetos Date. Siempre formatear antes de comparar.
- Selección de género es 100% frontend: el backend recibe los mismos campos sin importar el género elegido.
- Variables CSS (--gold, --bg-*, --text-*) permiten cambiar el tema completo con una sola clase en body.
- Los logos tienen fondo negro en el JPEG → usar object-fit: contain (no cover).
- SVG icons inline en option cards: usan currentColor → heredan el color del tema automáticamente.
- fondo.png fue procesado con Pillow para tener canal alpha real (RGBA, 76.8% transparente). No necesita mix-blend-mode.
- GitHub Pages es case-sensitive (Linux): todos los paths a assets deben coincidir exactamente (ej: "Logo Damas.jpeg" con D mayúscula).
- Header logo src inicial = "Logos/Logo Caballeros.jpeg" (no vacío) para evitar bug de iOS Safari que ignora cambios de src en img sin src.
- iOS Safari: font-size ≥16px en inputs para evitar zoom automático; env(safe-area-inset-bottom) para notch en toast/wsp-notify.
- Admin métricas: filtro de género en frontend (CONFIG.BARBEROS[genero]); no requiere cambios en backend.
- Citas extraordinarias: reutilizan API.reservar sin restricción de horario; conflictos validados server-side.
- Confirmación de reserva incluye tarjeta WhatsApp dinámica con link wa.me/ al especialista elegido.

## Para conectar el backend
1. Crear Google Sheet → copiar ID en Code.gs (SPREADSHEET_ID)
2. Ejecutar setup() en Apps Script para crear hojas (Citas, DiasBloquados, Config, Servicios, Barberos)
3. Desplegar como Web App (acceso: cualquier persona)
4. Pegar URL en js/config.js (API_URL)

## Para actualizar el backend
1. Pegar código nuevo en Apps Script
2. Implementar > Administrar implementaciones > lápiz > Versión: "Implementación nueva" > Implementar
3. La URL se mantiene igual

## Admin panel (admin.html)
- Acceso solo por URL directa (sin link desde index.html)
- PIN almacenado en hoja Config de Google Sheets (por defecto 1234)
- Secciones: Métricas/ventas, Citas del día (tabs por especialista), Bloquear día, Días bloqueados, Citas extraordinarias
- Al cancelar cita: opción opcional de enviar WhatsApp al cliente (#wspNotify flotante)
- Métricas: filtro por rango de fechas + área (caballeros/damas); gráfico de barras semanal o por día-de-semana (>31 días); ranking top 6 servicios

## QR Code
- Archivo: qr_rc_barber.png (574×574px)
- URL: https://rc-nicols.pages.dev
- Generado con Python (qrcode + Pillow): fondo #1a1a1a, módulos dorados (200,169,110)
- Logo Caballeros centrado al 35% del tamaño del QR; ERROR_CORRECT_H para tolerancia con logo overlay
- Para regenerar: ejecutar script Python con qrcode y Pillow instalados
