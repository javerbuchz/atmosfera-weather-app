const $ = (id) => document.getElementById(id);
const state = { place: {name:"Buenos Aires", admin1:"Ciudad Autónoma de Buenos Aires", country:"Argentina", latitude:-34.6037, longitude:-58.3816, timezone:"America/Argentina/Buenos_Aires"}, weather:null, air:null, fahrenheit:false, favorites:[], searchTimer:null };
const WMO = {
  0:["Despejado","☀"],1:["Mayormente despejado","🌤"],2:["Parcialmente nublado","⛅"],3:["Nublado","☁"],
  45:["Niebla","🌫"],48:["Niebla con escarcha","🌫"],51:["Llovizna ligera","🌦"],53:["Llovizna moderada","🌦"],55:["Llovizna intensa","🌧"],
  56:["Llovizna helada ligera","🌧"],57:["Llovizna helada intensa","🌧"],61:["Lluvia ligera","🌦"],63:["Lluvia moderada","🌧"],65:["Lluvia intensa","🌧"],
  66:["Lluvia helada ligera","🌧"],67:["Lluvia helada intensa","🌧"],71:["Nieve ligera","🌨"],73:["Nieve moderada","🌨"],75:["Nieve intensa","❄"],77:["Granizo pequeño","🌨"],
  80:["Chaparrones ligeros","🌦"],81:["Chaparrones moderados","🌧"],82:["Chaparrones fuertes","⛈"],85:["Nevadas ligeras","🌨"],86:["Nevadas fuertes","❄"],95:["Tormenta","⛈"],96:["Tormenta con granizo","⛈"],99:["Tormenta fuerte con granizo","⛈"]
};
const describe = code => WMO[code] || ["Condiciones variables","🌤"];
const temp = c => `${Math.round(state.fahrenheit ? c*9/5+32 : c)}°`;
const time = s => s ? s.slice(11,16) : "--:--";
const dayName = (s,i) => i===0?"Hoy":i===1?"Mañana":new Intl.DateTimeFormat("es-AR",{weekday:"long"}).format(new Date(s+"T12:00:00")).replace(/^./,c=>c.toUpperCase());
const dateLabel = s => new Intl.DateTimeFormat("es-AR",{day:"numeric",month:"short"}).format(new Date(s+"T12:00:00"));
const direction = deg => ["N","NE","E","SE","S","SO","O","NO"][Math.round(deg/45)%8];
const safe = n => Number.isFinite(n) ? n : "--";
const fmt = (n,d=0) => Number.isFinite(n) ? n.toFixed(d) : "--";

function setError(message){$("errorBanner").textContent=message;$("errorBanner").classList.remove("hidden")}
function clearError(){$("errorBanner").classList.add("hidden")}
function showLoading(on){$("loading").classList.toggle("hidden",!on);$("weatherApp").classList.toggle("hidden",on)}
function buildUrl(base,params){const u=new URL(base);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));return u.toString()}
async function getJSON(url){const r=await fetch(url);if(!r.ok)throw new Error(`Error de conexión (${r.status})`);return r.json()}

async function loadWeather(){
  clearError();showLoading(true);
  try{
    const p=state.place;
    const params={latitude:p.latitude,longitude:p.longitude,current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m",hourly:"temperature_2m,precipitation_probability,weather_code,relative_humidity_2m,wind_speed_10m",daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,sunshine_duration",forecast_days:7,timezone:p.timezone||"auto",wind_speed_unit:"kmh"};
    const [weather,air]=await Promise.all([
      getJSON(buildUrl("https://api.open-meteo.com/v1/forecast",params)),
      getJSON(buildUrl("https://air-quality-api.open-meteo.com/v1/air-quality",{latitude:p.latitude,longitude:p.longitude,current:"european_aqi,pm2_5,pm10,ozone",hourly:"european_aqi",timezone:p.timezone||"auto"})).catch(()=>null)
    ]);
    state.weather=weather;state.air=air;render();
    $("updatedAt").textContent="Actualizado "+new Intl.DateTimeFormat("es-AR",{hour:"2-digit",minute:"2-digit"}).format(new Date());
    showLoading(false);
  }catch(e){showLoading(false);setError("No pudimos obtener el pronóstico. Revisá tu conexión e intentá nuevamente. "+e.message)}
}
function render(){
  const d=state.weather,c=d.current,day=d.daily,h=d.hourly,idx=day.time.indexOf(c.time.slice(0,10)),today=idx>=0?idx:0;
  const [desc,icon]=describe(c.weather_code);
  $("placeName").textContent=state.place.name;$("placeSub").textContent=[state.place.admin1,state.place.country].filter(Boolean).join(" · ");
  $("currentIcon").textContent=icon;$("currentTemp").textContent=temp(c.temperature_2m);$("currentDescription").textContent=desc;
  $("feelsLike").textContent=temp(c.apparent_temperature);$("todayMin").textContent=temp(day.temperature_2m_min[today]);$("todayMax").textContent=temp(day.temperature_2m_max[today]);
  $("currentDate").textContent=new Intl.DateTimeFormat("es-AR",{weekday:"long",day:"numeric",month:"long"}).format(new Date(c.time));
  $("humidity").innerHTML=`${safe(c.relative_humidity_2m)}<small>%</small>`;$("wind").innerHTML=`${fmt(c.wind_speed_10m)}<small> km/h</small>`;$("windDirection").textContent=`Dirección ${direction(c.wind_direction_10m)}`;
  const hourIndex=h.time.findIndex(t=>t>=c.time.slice(0,13));const rain=hourIndex>=0?h.precipitation_probability[hourIndex]:0;
  $("rainChance").innerHTML=`${safe(rain)}<small>%</small>`;$("pressure").innerHTML=`${fmt(c.pressure_msl)}<small> hPa</small>`;
  $("uv").textContent=fmt(day.uv_index_max[today],1);$("uvNote").textContent=uvText(day.uv_index_max[today]);
  $("visibility").innerHTML=`${fmt((c.visibility||10000)/1000,1)}<small> km</small>`;
  $("sunrise").textContent=time(day.sunrise[today]);$("sunset").textContent=time(day.sunset[today]);$("sunrise2").textContent=time(day.sunrise[today]);$("sunset2").textContent=time(day.sunset[today]);
  const daylight=day.sunshine_duration[today]||0;$("dayLength").textContent=`${Math.floor(daylight/3600)} h ${Math.round(daylight%3600/60)} min`;
  renderHourly(h,hourIndex);renderDaily(day);renderAir();updateFavorite();
}
function uvText(n){return n<3?"Bajo":n<6?"Moderado":n<8?"Alto":n<11?"Muy alto":"Extremo"}
function renderHourly(h,start){
  const from=Math.max(0,start);let out="";
  for(let i=from;i<Math.min(from+24,h.time.length);i++){
    const [desc,ico]=describe(h.weather_code[i]);const label=i===from?"Ahora":time(h.time[i]);
    out+=`<div class="hour-item"><span class="hour-time">${label}</span><span class="hour-icon" title="${desc}">${ico}</span><strong class="hour-temp">${temp(h.temperature_2m[i])}</strong><span class="hour-rain">💧 ${safe(h.precipitation_probability[i])}%</span></div>`;
  }
  $("hourlyList").innerHTML=out;
}
function renderDaily(d){
  const vals=d.temperature_2m_max.slice(0,7),min=Math.min(...d.temperature_2m_min),max=Math.max(...vals);
  $("dailyList").innerHTML=d.time.slice(0,7).map((date,i)=>{
    const [desc,ico]=describe(d.weather_code[i]);const left=((d.temperature_2m_min[i]-min)/(max-min||1))*100;const width=((d.temperature_2m_max[i]-d.temperature_2m_min[i])/(max-min||1))*100;
    return `<div class="day-row"><div class="day-name">${dayName(date,i)}<span class="day-date">${dateLabel(date)}</span></div><div class="day-weather"><i>${ico}</i><span>${desc}</span></div><div class="range-track"><span class="range-fill" style="left:${left}%;width:${Math.max(8,width)}%"></span></div><div class="day-high">${temp(d.temperature_2m_max[i])}</div><div class="day-low">${temp(d.temperature_2m_min[i])}</div></div>`;
  }).join("");
}
function renderAir(){
  const a=state.air?.current;
  if(!a){$("aqiValue").textContent="—";$("aqiLabel").textContent="No disponible";$("aqiDescription").textContent="Sin datos de calidad del aire";return}
  const n=Math.round(a.european_aqi);const labels=["Buena","Aceptable","Moderada","Mala","Muy mala","Extremadamente mala"];const desc=["Calidad del aire satisfactoria.","Adecuada; algunas personas sensibles pueden verse afectadas.","Grupos sensibles: limitá esfuerzos prolongados al aire libre.","Puede afectar a grupos sensibles y personas con problemas respiratorios.","Reducí la exposición al aire libre.","Evitá esfuerzos al aire libre."];
  const i=n<=20?0:n<=40?1:n<=60?2:n<=80?3:n<=100?4:5;
  $("aqiValue").textContent=n;$("aqiLabel").textContent=labels[i];$("aqiDescription").textContent=desc[i];
  $("pm25").innerHTML=`${fmt(a.pm2_5,1)} <small>µg/m³</small>`;$("pm10").innerHTML=`${fmt(a.pm10,1)} <small>µg/m³</small>`;$("ozone").innerHTML=`${fmt(a.ozone,1)} <small>µg/m³</small>`;
}
function updateFavorite(){
  const key=`${state.place.latitude.toFixed(2)},${state.place.longitude.toFixed(2)}`;const saved=state.favorites.some(x=>x.key===key);
  $("favoriteBtn").classList.toggle("saved",saved);$("favoriteBtn").textContent=saved?"♥":"♡";
}
async function searchCity(q){
  if(!q.trim())return;
  try{
    const data=await getJSON(buildUrl("https://geocoding-api.open-meteo.com/v1/search",{name:q,count:7,language:"es",format:"json"}));
    const list=data.results||[];const box=$("suggestions");
    if(!list.length){box.innerHTML='<div class="suggestion">No encontramos esa ubicación.</div>';box.classList.remove("hidden");return}
    box.innerHTML=list.map((p,i)=>`<div class="suggestion" data-index="${i}">${p.name}<small>${[p.admin1,p.country].filter(Boolean).join(", ")}</small></div>`).join("");
    box.classList.remove("hidden");
    [...box.querySelectorAll(".suggestion[data-index]")].forEach(el=>el.addEventListener("click",()=>selectPlace(list[Number(el.dataset.index)])));
  }catch(e){setError("No se pudo buscar esa ciudad. Intentá nuevamente.")}
}
function selectPlace(p){
  state.place={name:p.name,admin1:p.admin1,country:p.country,latitude:p.latitude,longitude:p.longitude,timezone:p.timezone||"auto"};
  $("citySearch").value="";$("suggestions").classList.add("hidden");loadWeather();
}
$("citySearch").addEventListener("input",e=>{clearTimeout(state.searchTimer);const q=e.target.value.trim();if(q.length<2){$("suggestions").classList.add("hidden");return}state.searchTimer=setTimeout(()=>searchCity(q),300)});
$("citySearch").addEventListener("keydown",e=>{if(e.key==="Enter"){const first=$("suggestions").querySelector("[data-index]");if(first)first.click();else searchCity(e.target.value)}if(e.key==="Escape")$("suggestions").classList.add("hidden")});
document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("suggestions").classList.add("hidden")});
$("locationBtn").addEventListener("click",()=>{
  if(!navigator.geolocation){setError("Tu navegador no permite geolocalización.");return}
  $("locationBtn").textContent="Localizando…";
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{const {latitude,longitude}=pos.coords;const r=await getJSON(buildUrl("https://geocoding-api.open-meteo.com/v1/reverse",{latitude,longitude,language:"es",format:"json"}));const p=r.results?.[0];state.place={name:p?.name||"Mi ubicación",admin1:p?.admin1||"",country:p?.country||"",latitude,longitude,timezone:p?.timezone||"auto"};loadWeather()}
    catch{state.place={name:"Mi ubicación",admin1:"",country:"",latitude:pos.coords.latitude,longitude:pos.coords.longitude,timezone:"auto"};loadWeather()}
    $("locationBtn").innerHTML="<span>◎</span> Mi ubicación";
  },()=>{setError("No pudimos acceder a tu ubicación. Revisá los permisos del navegador.");$("locationBtn").innerHTML="<span>◎</span> Mi ubicación"},{enableHighAccuracy:false,timeout:10000});
});
$("unitToggle").addEventListener("click",()=>{state.fahrenheit=!state.fahrenheit;$("unitToggle").classList.toggle("active",state.fahrenheit);if(state.weather)render()});
$("refreshBtn").addEventListener("click",loadWeather);
$("favoriteBtn").addEventListener("click",()=>{
  const key=`${state.place.latitude.toFixed(2)},${state.place.longitude.toFixed(2)}`;const i=state.favorites.findIndex(x=>x.key===key);
  if(i>=0)state.favorites.splice(i,1);else state.favorites.push({key,name:state.place.name});
  updateFavorite();
});
loadWeather();