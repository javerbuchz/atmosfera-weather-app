# Atmósfera 2.0 — Weather Intelligence

Aplicación meteorológica responsive en español con pronóstico, inteligencia de actividades y experiencia PWA.

## Funcionalidades
- Clima actual, pronóstico horario (24 h), semanal (7 días) y calidad del aire.
- Índice de confort 0–100 y recomendador para running, pádel, ciclismo, caminata y aire libre.
- Comparación de hasta seis ciudades; la lista queda guardada en el navegador.
- Radar interactivo de precipitación con Leaflet, OpenStreetMap y RainViewer.
- Alertas locales de lluvia, tormentas y temperaturas extremas.
- Histórico de los últimos siete días mediante Open-Meteo Archive.
- PWA instalable y caché offline del shell principal.
- Búsqueda, geolocalización, Celsius/Fahrenheit y ubicaciones favoritas persistentes.

## Publicación
GitHub Pages desde `main`, carpeta raíz:
https://javerbuchz.github.io/atmosfera-weather-app/

## Tecnologías
Open-Meteo Forecast, Geocoding, Air Quality y Archive APIs; RainViewer; Leaflet; OpenStreetMap; Service Worker y Web App Manifest.

## Limitaciones y consideraciones
- Las alertas implementadas son notificaciones locales evaluadas cada 15 minutos mientras la app está abierta. Push con la app cerrada requiere backend, almacenamiento de suscripciones y claves VAPID.
- El radar depende de disponibilidad y condiciones del servicio RainViewer.
- El histórico usa el archivo de Open-Meteo; la disponibilidad puede tener retraso.
- La API gratuita de Open-Meteo tiene restricciones de uso no comercial. Revisar licencia y plan antes de uso comercial.
- La PWA requiere HTTPS o localhost.

## Desarrollo
```bash
python -m http.server 8080
```
Abrir http://localhost:8080.
