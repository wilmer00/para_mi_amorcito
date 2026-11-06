# Invitación para Aracely ❤️

HTML + CSS + JS puro. Sin backend. Listo para Vercel.

## Qué reemplazar
- **Personajes animados**: sprites PNG transparentes en `assets/sprites/` (`bear_walk1.png`, `panda_hug.png`...). Las acciones y su velocidad se definen en `js/main.js` > `ANIMS`.
- **Música**: coloca tu archivo en `assets/audio/musica.mp3` (o cambia `MUSIC_SRC` en `js/main.js`). Si no existe, suena una melodía romántica generada automáticamente.
- **Previsualización**: `assets/images/preview.jpg` (1200x630).

## Antes de publicar
1. En `index.html` reemplaza `TU-DOMINIO.vercel.app` por tu dominio real (4 lugares: og:image, og:url, twitter:image).
2. En `js/main.js` pon tu número en `WA_PHONE` (ej. `'59170000000'`) para el botón de WhatsApp.

## Probar local
Abre la carpeta en VS Code y usa la extensión *Live Server*.

## Publicar
Sube a GitHub, en Vercel: *Add New Project* → importa el repo → Deploy (sin configuración).

## Nota sobre WhatsApp
WhatsApp guarda la previsualización en caché. Si cambias la imagen, añade `?v=2` al enlace al compartirlo.
Three.js se carga por CDN (jsDelivr, v0.160.0); si falla, la página funciona igual sin el fondo 3D.

## Escenas especiales
- **Baile romántico** (pantalla de la pregunta): usa las 12 poses de la pareja en `assets/sprites/pareja_*.png`. Orden y duración de cada pose (en milisegundos) en la lista `DANCE` de `js/main.js`.
- **Osito en el plato** (pantalla final): imágenes sin fondo `assets/images/plato-1.png` y `plato-2.png` (guiño). Se alternan en `startWink()`.
- **Móvil**: el diseño se adapta a vertical y horizontal (ver bloques `@media` al final de `css/styles.css`).
