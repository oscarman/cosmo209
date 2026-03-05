let latitude = 4.711;
let longitude = -74.072;
let timezone = "America/Bogota";

// UI

const btn = document.getElementById("locationBtn");
const panel = document.getElementById("locationPanel");
const input = document.getElementById("cityInput");
const results = document.getElementById("cityResults");

btn.onclick = () => {
panel.classList.toggle("hidden");
};

// BUSCAR CIUDADES

input.oninput = async () => {

let query = input.value.trim();

if(query.length < 2){
results.innerHTML="";
return;
}

try{

let url =
`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=10&language=es&format=json`;

let res = await fetch(url);
let data = await res.json();

results.innerHTML="";

if(!data.results) return;

data.results.forEach(city=>{

let div = document.createElement("div");
div.className="cityItem";

div.innerText = `${city.name}, ${city.country}`;

div.onclick = ()=>{

latitude = Number(city.latitude);
longitude = Number(city.longitude);

if(city.timezone){
timezone = city.timezone;
}

panel.classList.add("hidden");

};

results.appendChild(div);

});

}catch(e){

console.log("Error buscando ciudad",e);

}

};

// CALENDARIO COSMOS 29

function customCalendar(date){

let start = new Date(date.getFullYear(),0,0);
let diff = date - start;

let dayOfYear = Math.floor(diff/86400000);

let month = Math.floor((dayOfYear-1)/29)+1;
let day = (dayOfYear-1)%29+1;

return [day,month,date.getFullYear()];

}

// LUNA

function moonAge(date){

const REF = new Date(Date.UTC(2000,0,6,18,14));
const CYCLE = 29.530588;

let diff = (date - REF)/86400000;

return (diff % CYCLE + CYCLE) % CYCLE;

}

function moonPhase(age){

if(age<1.8) return "LUNA NUEVA";
if(age<7.4) return "CUARTO CRECIENTE";
if(age<14.8) return "LUNA LLENA";
if(age<22.1) return "CUARTO MENGUANTE";

return "MENGUANTE";

}

// ESTACIONES

function getSeason(date){

let year = date.getFullYear();

let seasons=[

["EQUINOCCIO MARZO", new Date(year,2,20)],
["SOLSTICIO JUNIO", new Date(year,5,21)],
["EQUINOCCIO SEPTIEMBRE", new Date(year,8,22)],
["SOLSTICIO DICIEMBRE", new Date(year,11,21)]

];

for(let s of seasons){

if(date < s[1]) return s[0];

}

return "SOLSTICIO DICIEMBRE";

}

// CLIMA

async function getWeather(){

try{

let url =
`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

let res = await fetch(url);
let data = await res.json();

return {

temp:data.current_weather.temperature+273.15,
wind:data.current_weather.windspeed

};

}catch{

return {temp:0,wind:0};

}

}

// convertir fecha a hora decimal en la zona horaria correcta

function hourDecimal(date){

let local = new Date(date.toLocaleString("en-US",{timeZone:timezone}));

return local.getHours() + local.getMinutes()/60;

}

// UPDATE

function update(){

let now = new Date();

let local;

try{
local = new Date(now.toLocaleString("en-US",{timeZone:timezone}));
}catch{
local = now;
}

// HORA

let h = String(local.getHours()).padStart(2,'0');
let m = String(local.getMinutes()).padStart(2,'0');
let s = String(local.getSeconds()).padStart(2,'0');

document.getElementById("time").innerText =
`${h}:${m}:${s}`;

// CALENDARIO

let [d,mo,y] = customCalendar(local);

document.getElementById("date").innerText =
`DIA ${d} | MES ${mo} | AÑO ${y}`;

// LUNA

let age = moonAge(local);

document.getElementById("moon").innerText =
`FASE ${moonPhase(age)} | EDAD ${age.toFixed(1)}`;

// ESTACION

document.getElementById("season").innerText =
`ESTACION ${getSeason(local)}`;

// SOL

let sun = SunCalc.getTimes(local,latitude,longitude);

function safeTime(t){

if(!t || isNaN(t.getTime())) return "--:--";

let localTime =
new Date(t.toLocaleString("en-US",{timeZone:timezone}));

let hh = String(localTime.getHours()).padStart(2,'0');
let mm = String(localTime.getMinutes()).padStart(2,'0');

return `${hh}:${mm}`;

}

document.getElementById("dawn-text").innerText=`ALBA ${safeTime(sun.dawn)}`;
document.getElementById("sunrise-text").innerText=`AMANECER ${safeTime(sun.sunrise)}`;
document.getElementById("noon-text").innerText=`MEDIO DIA ${safeTime(sun.solarNoon)}`;
document.getElementById("sunset-text").innerText=`ATARDECER ${safeTime(sun.sunset)}`;
document.getElementById("dusk-text").innerText=`ANOCHECER ${safeTime(sun.dusk)}`;

// BARRA DE ENERGIA

let bar = document.getElementById("energy-fill");

if(sun.sunrise && sun.sunset){

let sunrise = hourDecimal(sun.sunrise);
let sunset = hourDecimal(sun.sunset);
let dawn = hourDecimal(sun.dawn);
let dusk = hourDecimal(sun.dusk);

let hour = local.getHours() + local.getMinutes()/60;

let energy = 0;

if(hour >= sunrise && hour <= sunset){
energy = (hour-sunrise)/(sunset-sunrise);
}

energy = Math.max(0,Math.min(1,energy));

bar.style.width = (energy*100)+"%";

// COLORES

if(hour < dawn){
bar.style.background = "#001a33";
}
else if(hour < sunrise){
bar.style.background = "#ff9933";
}
else if(hour < sunset){
bar.style.background = "#ffff33";
}
else if(hour < dusk){
bar.style.background = "#ff6600";
}
else{
bar.style.background = "#001a33";
}

}

// CLIMA

getWeather().then(w=>{

document.getElementById("temp").innerText =
`TEMP ${w.temp.toFixed(2)} K | VIENTO ${w.wind} KM/H`;

});

}

setInterval(update,1000);

update();
