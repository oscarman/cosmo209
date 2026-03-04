# app.py
from flask import Flask, jsonify, render_template
import datetime, pytz, requests
from astral import Observer
from astral.sun import sun

app = Flask(__name__)
timezone = pytz.timezone("America/Bogota")

# Coordenadas por defecto
latitude = 4.336
longitude = -74.363

# LUNA
LUNAR_CYCLE = 29.530588
REFERENCE_NEW_MOON = datetime.datetime(2000,1,6,18,14,tzinfo=pytz.utc)

def custom_calendar(date):
    year = date.year
    day_of_year = date.timetuple().tm_yday
    month = (day_of_year-1)//29 +1
    day = (day_of_year-1)%29 +1
    return day, month, year

def moon_age(now):
    diff = now.astimezone(pytz.utc) - REFERENCE_NEW_MOON
    days = diff.total_seconds()/86400
    return days % LUNAR_CYCLE

def moon_phase_name(age):
    if age < 1.8: return "LUNA NUEVA"
    elif age < 7.4: return "CUARTO CRECIENTE"
    elif age < 14.8: return "LUNA LLENA"
    elif age < 22.1: return "CUARTO MENGUANTE"
    else: return "MENGUANTE"

def get_season(date):
    year = date.year
    seasons = [
        ("EQUINOCCIO MARZO", datetime.datetime(year,3,20,tzinfo=timezone)),
        ("SOLSTICIO JUNIO", datetime.datetime(year,6,21,tzinfo=timezone)),
        ("EQUINOCCIO SEPTIEMBRE", datetime.datetime(year,9,22,tzinfo=timezone)),
        ("SOLSTICIO DICIEMBRE", datetime.datetime(year,12,21,tzinfo=timezone))
    ]
    for name, day in seasons:
        if date < day: return name
    return "SOLSTICIO DICIEMBRE"

def solar_data(now):
    obs = Observer(latitude=latitude, longitude=longitude)
    s = sun(obs, date=now, tzinfo=timezone)
    sunrise = s['sunrise']
    sunset = s['sunset']
    noon = s['noon']
    dusk = s['dusk']
    dawn = s['dawn']
    true_noon = sunrise + (sunset - sunrise)/2
    if sunrise < now < sunset:
        energy = (now - sunrise).total_seconds() / (sunset - sunrise).total_seconds()
    else:
        energy = 0
    return sunrise, sunset, noon, dusk, dawn, true_noon, energy

def weather():
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current_weather=true"
        r = requests.get(url).json()
        temp_k = r['current_weather']['temperature'] + 273.15
        wind = r['current_weather']['windspeed']
        return temp_k, wind
    except:
        return 0, 0

@app.route("/data")
def get_data():
    now = datetime.datetime.now(timezone)
    day, month, year = custom_calendar(now)
    age = moon_age(now)
    phase = moon_phase_name(age)
    season = get_season(now)
    sunrise, sunset, noon, dusk, dawn, true_noon, energy = solar_data(now)
    temp_k, wind = weather()

    return jsonify({
        "hour": now.strftime("%H:%M:%S"),
        "day": day,
        "month": month,
        "year": year,
        "moon_phase": phase,
        "moon_age": round(age,2),
        "season": season,
        "sunrise": sunrise.strftime("%H:%M:%S"),
        "sunset": sunset.strftime("%H:%M:%S"),
        "noon": noon.strftime("%H:%M:%S"),
        "true_noon": true_noon.strftime("%H:%M:%S"),
        "dawn": dawn.strftime("%H:%M:%S"),
        "dusk": dusk.strftime("%H:%M:%S"),
        "solar_energy": round(energy*100,1),
        "temperature_k": round(temp_k,2),
        "wind": wind
    })

@app.route("/")
def index():
    return render_template("index.html")
