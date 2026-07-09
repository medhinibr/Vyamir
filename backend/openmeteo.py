import requests
import feedparser
from datetime import datetime, timedelta
from backend.cache import get_cache, set_cache

def search_city(query):
    """
    Search for a city using Nominatim with caching (24 hours).
    """
    query = query.lower().strip()
    cache_key = f"geo:{query}"
    
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

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
            set_cache(cache_key, results, expiry_seconds=86400) # 24 hours
            return results
            
        # 2. Fallback to Open-Meteo
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={query}&count=5&language=en&format=json"
        response = requests.get(url, timeout=5)
        data = response.json()
        if 'results' in data:
            results = data['results']
            set_cache(cache_key, results, expiry_seconds=86400) # 24 hours
            return results
            
        return []
    except Exception as e:
        print(f"Geocoding Error: {e}")
        return []

def get_forecast_data(lat, lon):
    """
    Fetch comprehensive weather data from Open-Meteo with caching (15 min).
    """
    # Round coords to 2 decimals to increase cache hit rate for nearby clicks
    lat_r = round(float(lat), 2)
    lon_r = round(float(lon), 2)
    cache_key = f"forecast:{lat_r}:{lon_r}"
    
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            "&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,"
            "weather_code,pressure_msl,surface_pressure,visibility,wind_speed_10m,uv_index,soil_temperature_0cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm"
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max"
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m"
            "&timezone=auto"
        )
        response = requests.get(url, timeout=5)
        data = response.json()
        
        set_cache(cache_key, data, expiry_seconds=900) # 15 minutes
        return data
    except Exception as e:
        print(f"Forecast Error: {e}")
        return None

def get_historical_trend(lat, lon, current_temp):
    """
    Compare today's weather with exactly one year ago.
    """
    lat_r = round(float(lat), 2)
    lon_r = round(float(lon), 2)
    today_str = datetime.now().strftime('%Y-%m-%d')
    cache_key = f"historical:{lat_r}:{lon_r}:{today_str}"
    
    cached = get_cache(cache_key)
    if cached is not None:
        hist_max = cached
    else:
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
                set_cache(cache_key, hist_max, expiry_seconds=86400) # 24 hours
            else:
                hist_max = None
        except Exception as e:
            print(f"Historical Error: {e}")
            hist_max = None

    if hist_max is not None:
        diff = current_temp - hist_max
        if abs(diff) < 1:
            return "Similar to last year."
        elif diff > 0:
            return f"Today is {abs(int(diff))}°C warmer than last year."
        else:
            return f"Today is {abs(int(diff))}°C cooler than last year."
            
    return "Historical data unavailable."

def get_air_quality_data(lat, lon):
    """
    Fetch Air Quality and Pollen data.
    """
    lat_r = round(float(lat), 2)
    lon_r = round(float(lon), 2)
    cache_key = f"aqi:{lat_r}:{lon_r}"
    
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    try:
        url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}"
            "&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,uv_index,alder_pollen,birch_pollen,grass_pollen,ragweed_pollen,olive_pollen"
            "&timezone=auto"
        )
        response = requests.get(url)
        data = response.json()
        set_cache(cache_key, data, expiry_seconds=900) # 15 minutes
        return data
    except Exception as e:
        print(f"AQI Error: {e}")
        return None

def get_news_feed():
    """
    Fetch top weather news with simple caching (10 min).
    """
    cache_key = "news_feed"
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

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
        
        set_cache(cache_key, news_items, expiry_seconds=600) # 10 minutes
        return news_items
    except Exception as e:
        print(f"News Error: {e}")
        return []
