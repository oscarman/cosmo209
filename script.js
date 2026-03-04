const latitude = 4.336;
const longitude = -74.363;

let now = new Date();
// ===== Obtener ubicación real del móvil =====
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      console.log("Ubicación actual:", latitude, longitude);
    },
    function(err) {
      console.warn("No se pudo obtener la ubicación, usando valores por defecto");
    }
  );
} else {
  console.warn("Geolocalización no soportada, usando valores por defecto");
}

function customCalendar(date){
    let dayOfYear = Math.floor((date - new Date(date.getFullYear(),0,0))/86400000);
    let month = Math.floor((dayOfYear-1)/29)+1;
    let day = (dayOfYear-1)%29+1;
    return [day,month,date.getFullYear()];
}

function moonAge(date){
    const REFERENCE_NEW_MOON = new Date(Date.UTC(2000,0,6,18,14));
    const LUNAR_CYCLE = 29.530588;
    let diff = (date - REFERENCE_NEW_MOON)/86400000;
    return diff % LUNAR_CYCLE;
}

function moonPhaseName(age){
    if(age<1.8) return "LUNA NUEVA";
    if(age<7.4) return "CUARTO CRECIENTE";
    if(age<14.8) return "LUNA LLENA";
    if(age<22.1) return "CUARTO MENGUANTE";
    return "MENGUANTE";
}

function getSeason(date){
    let year = date.getFullYear();
    let seasons = [
        ["EQUINOCCIO MARZO", new Date(year,2,20)],
        ["SOLSTICIO JUNIO", new Date(year,5,21)],
        ["EQUINOCCIO SEPTIEMBRE", new Date(year,8,22)],
        ["SOLSTICIO DICIEMBRE", new Date(year,11,21)]
    ];
    for(let [name, day] of seasons){
        if(date<day) return name;
    }
    return "SOLSTICIO DICIEMBRE";
}

async function getWeather(){
    try{
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        let res = await fetch(url);
        let data = await res.json();
        return {
            temp: data.current_weather.temperature + 273.15,
            wind: data.current_weather.windspeed
        };
    }catch{
        return {temp:0, wind:0};
    }
}

function update(){
    let now = new Date();
    let [day,month,year] = customCalendar(now);
    let age = moonAge(now);
    let phase = moonPhaseName(age);
    let season = getSeason(now);

    // ===== Calcular horas del sol =====
    let sunTimes = SunCalc.getTimes(now, latitude, longitude);
    
    // Formatear horas
    function formatTime(date){
        if(!date) return "--:--";
        return date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }
    
    let dawn = formatTime(sunTimes.dawn);
    let sunrise = formatTime(sunTimes.sunrise);
    let solarNoon = formatTime(sunTimes.solarNoon);
    let sunset = formatTime(sunTimes.sunset);
    let dusk = formatTime(sunTimes.dusk);
    
    // Mostrar en pantalla
    document.getElementById("sun").innerText = 
      `ALBA: ${dawn} | AMANECER: ${sunrise} | MEDIO DIA: ${solarNoon} | ATARDECER: ${sunset} | ANOCHECER: ${dusk}`;

    document.getElementById("dawn-text").innerText = `ALBA: ${dawn}`;
    document.getElementById("sunrise-text").innerText = `AMANECER: ${sunrise}`;
    document.getElementById("noon-text").innerText = `MEDIO DIA: ${solarNoon}`;
    document.getElementById("sunset-text").innerText = `ATARDECER: ${sunset}`;
    document.getElementById("dusk-text").innerText = `ANOCHECER: ${dusk}`;
    
    // Clima
    getWeather().then(w=>{
        document.getElementById("temp").innerText = `TEMP: ${w.temp.toFixed(2)} K | VIENTO: ${w.wind} KM/H`;
    });

    // Barra solar aproximada
    let hour = now.getHours() + now.getMinutes()/60;
    let energy = Math.max(0, Math.min(1, (hour-6)/12)); // 6am->6pm
    document.getElementById("energy").style.width = (energy*100)+"%";
}

setInterval(update,1000);
update();
