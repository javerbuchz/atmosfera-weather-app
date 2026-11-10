# Atmósfera — Weather Web App

Aplicación meteorológica responsive en español, construida con HTML/CSS/JavaScript vanilla y datos de Open-Meteo.

## Ejecutar
- Abrí `index.html` en un navegador moderno, o serví la carpeta con cualquier servidor estático.
- Recomendado: `python -m http.server 8080` y navegar a `http://localhost:8080`.
- La geolocalización requiere HTTPS o localhost.

## Funcionalidades
- Condiciones actuales y sensación térmica.
- Búsqueda de ciudades con Open-Meteo Geocoding.
- Ubicación actual opcional vía Geolocation API.
- Pronóstico horario (24 horas) y diario (7 días).
- Humedad, viento, lluvia, presión, UV y visibilidad.
- Calidad del aire (European AQI, PM2.5, PM10 y ozono).
- Amanecer, atardecer y duración de luz solar.
- Conversión Celsius/Fahrenheit.
- Diseño responsive para desktop y móvil.

## APIs utilizadas
- Forecast: https://api.open-meteo.com/v1/forecast
- Geocoding: https://geocoding-api.open-meteo.com/v1/search
- Air Quality: https://air-quality-api.open-meteo.com/v1/air-quality

No requiere API key para uso no comercial. Open-Meteo requiere atribución de los datos bajo CC BY 4.0. Ver https://open-meteo.com/en/docs y https://open-meteo.com/en/docs/air-quality-api.

## Nota de uso
La API gratuita de Open-Meteo está destinada a uso no comercial. Para uso comercial, revisar sus planes y condiciones vigentes.
