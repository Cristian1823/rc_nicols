# RC Barber & Spa / RC Nicoll's - Sistema de Agendamiento

## Estructura
```
index.html              → Interfaz cliente (landing género + 6 pasos de reserva)
admin.html              → Panel admin (PIN login, gestión citas, bloqueo días)
css/styles.css          → Estilos base + tema Caballeros (oscuro/dorado) + tema Damas (blanco/lila)
js/config.js            → Configuración (barberos, servicios, horario, API URL)
js/api.js               → Comunicación con backend via JSONP
js/app.js               → Lógica del cliente (selección género, calendario, slots, reservas)
js/admin.js             → Lógica admin (PIN, citas, bloquear días)
google-apps-script/Code.gs → Backend Google Apps Script
Logos/
  Logo Caballeros.jpeg  → Logo RC Barber & Spa (letras crema sobre negro)
  Logo damas.jpeg       → Logo RC Nicoll's (círculo morado sobre negro)
  fondo.png             → Ilustración barbería (RGBA con transparencia, disponible para uso futuro)
```

## Stack
- Frontend: HTML/CSS/JS vanilla (sin frameworks)
- Backend: Google Apps Script desplegado como Web App
- Base de datos: Google Sheets (hojas: Citas, DiasBloquados, Config)
- Comunicación: JSONP (evita problemas de CORS con Google Apps Script)

## Configuración
- Barberos: Carlos, Miguel
- Horario: Lunes a Sábado, 8:00 - 18:00 (domingos cerrado)
- Servicios: Corte+Barba (1h), Solo Corte (1h)
- PIN admin por defecto: 1234 (hoja Config en Google Sheets)

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
  - barberos (Carlos/Miguel): silueta de persona + mini-tijeras badge
  - Contenedor icono: fondo con borde dorado/violeta, se ilumina al seleccionar
  - Card seleccionada tiene línea de acento vertical izquierda (::before)
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

## Para conectar el backend
1. Crear Google Sheet → copiar ID en Code.gs (SPREADSHEET_ID)
2. Ejecutar setup() en Apps Script para crear hojas
3. Desplegar como Web App (acceso: cualquier persona)
4. Pegar URL en js/config.js (API_URL)

## Para actualizar el backend
1. Pegar código nuevo en Apps Script
2. Implementar > Administrar implementaciones > lápiz > Versión: "Implementación nueva" > Implementar
3. La URL se mantiene igual
