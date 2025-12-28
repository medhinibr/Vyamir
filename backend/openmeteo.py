import requests
import feedparser
from datetime import datetime, timedelta

# Global cache for geocoding results
_geo_cache = {}

def search_city(query):
    """
    Search for a city using Nominatim with caching.
    """
    query = query.lower().strip()
    if query in _geo_cache:
        return _geo_cache[query]

    try:
        # 1. Try Nominatim
        headers = {'User-Agent': 'VyamirWeatherApp/1.0'}
        url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5&addressdetails=1"
        response = requests.get(url, headers=headers, timeout=5)
        data = response.json()
        
        results = []
        if isinstance(data, list) and len(data) > 0:
            for item in data:
                results.append({
                    'id': item.get('place_id'),
                    'name': item.get('name') or item.get('display_name').split(',')[0],
                    'latitude': float(item.get('lat')),
                    'longitude': float(item.get('lon')),
                    'country_code': item.get('address', {}).get('country_code', '').upper(),
                    'admin1': item.get('address', {}).get('state'),
                    'country': item.get('address', {}).get('country')
                })
            _geo_cache[query] = results
            return results
            
        # 2. Fallback to Open-Meteo
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={query}&count=5&language=en&format=json"
        response = requests.get(url, timeout=5)
        data = response.json()
        if 'results' in data:
            _geo_cache[query] = data['results']
            return data['results']
            
        return []
    except Exception as e:
        print(f"Geocoding Error: {e}")
        return []

# Global cache for weather data
_weather_cache = {}

def get_forecast_data(lat, lon):
    """
    Fetch comprehensive weather data from Open-Meteo with caching (15 min).
    """
    # Round coords to 2 decimals to increase cache hit rate for nearby clicks
    key = f"{round(float(lat), 2)}_{round(float(lon), 2)}"
    now = datetime.now()
    
    if key in _weather_cache:
        timestamp, data = _weather_cache[key]
        if (now - timestamp).total_seconds() < 900: # 15 minutes
            return data

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            "&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,precipitation,"
            "weathercode,pressure_msl,surface_pressure,visibility,windspeed_10m,uv_index"
            "&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max"
            "&current_weather=true&timezone=auto"
        )
        response = requests.get(url, timeout=5)
        data = response.json()
        
        _weather_cache[key] = (now, data)
        return data
    except Exception as e:
        print(f"Forecast Error: {e}")
        return None

def get_historical_trend(lat, lon, current_temp):
    """
    Compare today's weather with exactly one year ago.
    """
    try:
        today = datetime.now()
        last_year = today - timedelta(days=365)
        date_str = last_year.strftime('%Y-%m-%d')
        
        url = (
            f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
            f"&start_date={date_str}&end_date={date_str}&daily=temperature_2m_max,temperature_2m_min"
            "&timezone=auto"
        )
        response = requests.get(url)
        data = response.json()
        
        if 'daily' in data and data['daily']['temperature_2m_max']:
            hist_max = data['daily']['temperature_2m_max'][0]
            diff = current_temp - hist_max
            
            if abs(diff) < 1:
                return "Similar to last year."
            elif diff > 0:
                return f"Today is {abs(int(diff))}°C warmer than last year."
            else:
                return f"Today is {abs(int(diff))}°C cooler than last year."
        return "Historical data unavailable."
    except Exception as e:
        print(f"Historical Error: {e}")
        return "Historical data unavailable."

def get_air_quality_data(lat, lon):
    """
    Fetch Air Quality and Pollen data.
    """
    try:
        url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}"
            "&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,uv_index,alder_pollen,birch_pollen,grass_pollen,ragweed_pollen,olive_pollen"
            "&timezone=auto"
        )
        response = requests.get(url)
        return response.json()
    except Exception as e:
        print(f"AQI Error: {e}")
        return None

# Global cache for news to avoid unnecessary parsing
_news_cache = []
_news_cache_time = None

def get_news_feed():
    """
    Fetch top weather news with simple caching.
    """
    global _news_cache, _news_cache_time
    
    # Cache for 10 minutes
    if _news_cache and _news_cache_time and (datetime.now() - _news_cache_time).total_seconds() < 600:
        return _news_cache

    try:
        url = "https://moxie.foxweather.com/google-publisher/weather-news.xml"
        feed = feedparser.parse(url)
        news_items = []
        for entry in feed.entries[:3]:
            news_items.append({
                'title': entry.title,
                'link': entry.link,
                'published': entry.published
            })
        
        _news_cache = news_items
        _news_cache_time = datetime.now()
        return news_items
    except Exception as e:
        print(f"News Error: {e}")
        return _news_cache if _news_cache else []
