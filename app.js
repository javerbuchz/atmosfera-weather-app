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

// ATMO V2: activity intelligence, city comparison, precipitation radar, alerts, archive and PWA
const V2={activity:"running",cities:JSON.parse(localStorage.getItem("atm_cities")||"[]"),map:null,radarLayer:null,notified:new Set(),installPrompt:null};
const activityRules={running:{name:"Running",wind:28,rain:25,heat:31,cold:5},padel:{name:"Pádel",wind:22,rain:15,heat:30,cold:8},cycling:{name:"Ciclismo",wind:24,rain:15,heat:30,cold:5},walking:{name:"Caminata",wind:35,rain:50,heat:34,cold:2},outdoor:{name:"Aire libre",wind:30,rain:35,heat:33,cold:4}};
function activityScore(t,r,w,h,uv,key){
 const a=activityRules[key]||activityRules.outdoor;let n=100;
 if(t>a.heat)n-=Math.min(35,(t-a.heat)*5);if(t<a.cold)n-=Math.min(30,(a.cold-t)*4);
 if(r>a.rain)n-=Math.min(45,(r-a.rain)*.9);if(w>a.wind)n-=Math.min(25,(w-a.wind)*1.3);
 if(h>80)n-=Math.min(15,(h-80)*.7);if(uv>=8)n-=12;else if(uv>=6)n-=6;
 return Math.max(0,Math.min(100,Math.round(n)));
}
function scoreName(n){return n>=85?"Excelente":n>=70?"Muy bueno":n>=50?"Aceptable":n>=30?"Desfavorable":"No recomendado"}
function renderActivityV2(){
 if(!state.weather)return;
 const c=state.weather.current,h=state.weather.hourly,d=state.weather.daily;
 const i=Math.max(0,h.time.findIndex(x=>x>=c.time.slice(0,13))),rain=h.precipitation_probability[i]||0,uv=d.uv_index_max[0]||0;
 const n=activityScore(c.temperature_2m,rain,c.wind_speed_10m,c.relative_humidity_2m,uv,"outdoor");
 $("comfortScore").textContent=n;$("comfortMeter").style.width=n+"%";
 $("comfortSummary").textContent=scoreName(n)+" para actividades al aire libre en "+state.place.name+".";
 $("comfortFactors").innerHTML=["🌡 "+Math.round(c.temperature_2m)+"°C","💧 "+rain+"% lluvia","〰 "+Math.round(c.wind_speed_10m)+" km/h viento","☼ UV "+uv.toFixed(1)].map(x=>'<span class="factor-chip">'+x+"</span>").join("");
 const start=i,items=[];
 for(let j=start;j<Math.min(start+18,h.time.length);j++){
  const day=Math.max(0,d.time.indexOf(h.time[j].slice(0,10)));
  items.push({score:activityScore(h.temperature_2m[j],h.precipitation_probability[j]||0,h.wind_speed_10m[j],h.relative_humidity_2m[j],d.uv_index_max[day]||0,V2.activity),time:h.time[j].slice(11,16),temp:h.temperature_2m[j],rain:h.precipitation_probability[j]||0,wind:h.wind_speed_10m[j]});
 }
 items.sort((a,b)=>b.score-a.score);const best=items[0];
 $("activityResult").innerHTML=best?"<strong>"+activityRules[V2.activity].name+": "+scoreName(best.score)+" · "+best.time+"</strong><br>Confort estimado "+best.score+"/100 · "+Math.round(best.temp)+"°C · lluvia "+best.rain+"% · viento "+Math.round(best.wind)+" km/h.<br><small>Estimación orientativa, no sustituye alertas oficiales.</small>":"No hay datos horarios suficientes.";
}
$("activityPicker").addEventListener("click",e=>{const b=e.target.closest("[data-activity]");if(!b)return;V2.activity=b.dataset.activity;document.querySelectorAll(".activity-choice").forEach(x=>x.classList.toggle("selected",x===b));renderActivityV2()});
function renderCompareShell(){
 if(!V2.cities.length)V2.cities=[{name:state.place.name,latitude:state.place.latitude,longitude:state.place.longitude,timezone:state.place.timezone},{name:"Córdoba",latitude:-31.4167,longitude:-64.1833,timezone:"America/Argentina/Cordoba"},{name:"Mar del Plata",latitude:-38.0055,longitude:-57.5426,timezone:"America/Argentina/Buenos_Aires"}];
 V2.cities=V2.cities.slice(0,6);localStorage.setItem("atm_cities",JSON.stringify(V2.cities));
 $("compareGrid").innerHTML=V2.cities.map((p,i)=>'<article class="compare-card" id="cmp'+i+'"><button class="compare-remove" data-remove="'+i+'">×</button><h3>'+p.name+'</h3><div class="compare-temp">…</div><div class="compare-desc">Consultando…</div></article>').join("");
 V2.cities.forEach(async(p,i)=>{
  try{
   const w=await getJSON(buildUrl("https://api.open-meteo.com/v1/forecast",{latitude:p.latitude,longitude:p.longitude,current:"temperature_2m,apparent_temperature,weather_code,wind_speed_10m",hourly:"precipitation_probability",forecast_days:1,timezone:p.timezone||"auto"}));
   const el=$("cmp"+i);if(!el)return;el.querySelector(".compare-temp").textContent=temp(w.current.temperature_2m);el.querySelector(".compare-desc").textContent=describe(w.current.weather_code)[0];
   const m=document.createElement("div");m.className="compare-meta";m.textContent="Lluvia "+(w.hourly.precipitation_probability[0]??"—")+"% · Viento "+Math.round(w.current.wind_speed_10m)+" km/h";el.append(m);
  }catch{const el=$("cmp"+i);if(el)el.querySelector(".compare-desc").textContent="Datos no disponibles"}
 });
}
$("compareGrid").addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(!b)return;V2.cities.splice(Number(b.dataset.remove),1);localStorage.setItem("atm_cities",JSON.stringify(V2.cities));renderCompareShell()});
$("addCompareCity").addEventListener("click",async()=>{
 const q=$("compareCityInput").value.trim();if(!q)return;
 try{const g=await getJSON(buildUrl("https://geocoding-api.open-meteo.com/v1/search",{name:q,count:1,language:"es",format:"json"}));const p=g.results?.[0];
  if(!p){$("compareCityInput").placeholder="Ciudad no encontrada";return}
  if(V2.cities.length>=6){$("compareCityInput").placeholder="Máximo 6 ciudades";return}
  V2.cities.push({name:p.name,latitude:p.latitude,longitude:p.longitude,timezone:p.timezone||"auto"});$("compareCityInput").value="";renderCompareShell();
 }catch{$("compareCityInput").placeholder="Error de búsqueda"}
});
$("compareCityInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("addCompareCity").click()});
async function initRadarV2(){
 if(!window.L){$("radarStatus").textContent="Mapa no disponible";return}
 if(!V2.map){V2.map=L.map("weatherRadar",{scrollWheelZoom:false}).setView([state.place.latitude,state.place.longitude],7);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"© OpenStreetMap"}).addTo(V2.map);L.marker([state.place.latitude,state.place.longitude]).addTo(V2.map).bindPopup(state.place.name)}
 else V2.map.setView([state.place.latitude,state.place.longitude],7);
 try{
  const m=await getJSON("https://api.rainviewer.com/public/weather-maps.json"),frames=[...(m.radar?.past||[]),...(m.radar?.nowcast||[])],frame=frames[frames.length-1];
  if(!frame)throw new Error("No frames");
  if(V2.radarLayer)V2.map.removeLayer(V2.radarLayer);
  V2.radarLayer=L.tileLayer(m.host+frame.path+"/256/{z}/{x}/{y}/2/1_1.png",{opacity:.7,attribution:"Radar © RainViewer"}).addTo(V2.map);
  $("radarStatus").textContent="Actualizado · "+new Date(frame.time*1000).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
 }catch{$("radarStatus").textContent="Radar temporalmente no disponible"}
 setTimeout(()=>V2.map&&V2.map.invalidateSize(),300);
}
$("radarRefresh").addEventListener("click",initRadarV2);
function sendWeatherAlert(key,title,body){if(V2.notified.has(key))return;V2.notified.add(key);if(Notification.permission==="granted")new Notification(title,{body,tag:key})}
function checkAlertsV2(){
 if(!state.weather||!("Notification"in window)||Notification.permission!=="granted")return;
 const p=JSON.parse(localStorage.getItem("atm_alerts")||'{"rain":true,"storm":true,"temp":true}'),c=state.weather.current,h=state.weather.hourly,i=Math.max(0,h.time.findIndex(x=>x>=c.time.slice(0,13))),rain=h.precipitation_probability[i]||0;
 if(p.rain&&rain>=65)sendWeatherAlert("rain-"+state.place.name+"-"+h.time[i],"Lluvia próxima","Probabilidad de lluvia del "+rain+"% en "+state.place.name+".");
 if(p.storm&&[95,96,99].includes(c.weather_code))sendWeatherAlert("storm-"+state.place.name+"-"+c.time.slice(0,13),"Tormenta","Se detectó código de tormenta en el pronóstico.");
 if(p.temp&&(c.temperature_2m>=35||c.temperature_2m<=2))sendWeatherAlert("temp-"+state.place.name+"-"+c.time.slice(0,10),"Temperatura extrema","Temperatura actual: "+Math.round(c.temperature_2m)+"°C.");
}
async function activateAlertsV2(){
 if(!("Notification"in window)){$("alertStatus").textContent="Tu navegador no soporta notificaciones.";return}
 const p=await Notification.requestPermission();if(p!=="granted"){$("alertStatus").textContent="Permiso no concedido.";return}
 localStorage.setItem("atm_alerts",JSON.stringify({rain:$("alertRain").checked,storm:$("alertStorm").checked,temp:$("alertTemp").checked}));
 $("alertStatus").textContent="Notificaciones habilitadas. Se evalúan cada 15 minutos mientras la aplicación permanece abierta.";checkAlertsV2();
}
$("enableAlerts").addEventListener("click",activateAlertsV2);
["alertRain","alertStorm","alertTemp"].forEach(id=>$(id).addEventListener("change",()=>localStorage.setItem("atm_alerts",JSON.stringify({rain:$("alertRain").checked,storm:$("alertStorm").checked,temp:$("alertTemp").checked}))));
async function loadHistoryV2(){
 const end=new Date();end.setDate(end.getDate()-1);const start=new Date(end);start.setDate(start.getDate()-6);const iso=d=>d.toISOString().slice(0,10);
 try{
  const h=await getJSON(buildUrl("https://archive-api.open-meteo.com/v1/archive",{latitude:state.place.latitude,longitude:state.place.longitude,start_date:iso(start),end_date:iso(end),daily:"temperature_2m_max,temperature_2m_min,precipitation_sum",timezone:state.place.timezone||"auto"}));
  const d=h.daily;if(!d?.time?.length)throw new Error("No data");const hi=Math.max(...d.temperature_2m_max),lo=Math.min(...d.temperature_2m_min),avg=d.temperature_2m_max.reduce((a,b)=>a+b,0)/d.time.length,rain=d.precipitation_sum.reduce((a,b)=>a+b,0);
  $("historySummary").textContent="Últimos "+d.time.length+" días · máxima media "+avg.toFixed(1)+"°C · extremo máximo "+hi.toFixed(1)+"°C · mínima extrema "+lo.toFixed(1)+"°C · lluvia acumulada "+rain.toFixed(1)+" mm.";
  $("historyChart").innerHTML=d.time.map((day,i)=>{const high=Math.max(5,(d.temperature_2m_max[i]-lo)/(hi-lo||1)*100),low=Math.max(4,(d.temperature_2m_min[i]-lo)/(hi-lo||1)*100);return '<div class="history-day"><div class="history-bars"><span class="history-bar low" style="height:'+low+'%"></span><span class="history-bar" style="height:'+high+'%"></span></div><strong>'+Math.round(d.temperature_2m_max[i])+'°</strong><small>'+new Date(day+"T12:00:00").toLocaleDateString("es-AR",{weekday:"short"})+"</small></div>"}).join("");
 }catch{$("historySummary").textContent="El archivo histórico no está disponible para esta ubicación.";$("historyChart").innerHTML=""}
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();V2.installPrompt=e;$("installAppBtn").hidden=false});
$("installAppBtn").addEventListener("click",async()=>{if(!V2.installPrompt)return;V2.installPrompt.prompt();await V2.installPrompt.userChoice;V2.installPrompt=null;$("installAppBtn").hidden=true});
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
const baseRenderV2=render;
render=function(){baseRenderV2();renderActivityV2();renderCompareShell();initRadarV2();loadHistoryV2();checkAlertsV2()};
const savedAlerts=JSON.parse(localStorage.getItem("atm_alerts")||"null");
if(savedAlerts){$("alertRain").checked=!!savedAlerts.rain;$("alertStorm").checked=!!savedAlerts.storm;$("alertTemp").checked=!!savedAlerts.temp}
if("Notification"in window&&Notification.permission==="granted")$("alertStatus").textContent="Permiso concedido. Las alertas se revisan mientras la app está abierta.";
setInterval(checkAlertsV2,15*60*1000);
