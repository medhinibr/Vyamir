from flask import Flask, render_template, request, jsonify, send_from_directory
from backend import openmeteo
from dotenv import load_dotenv
import os
import math
import requests
import logging

# Configure standardized logging matrix
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("vyamir")

load_dotenv() # Load environmental variables immediately

app = Flask(__name__)
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), 'frontend/dist'))

@app.after_request
def add_caching_headers(response):
    """
    Apply efficient caching rules:
    - Cache static assets (CSS, JS, images) for 1 year (31,536,000 seconds).
    - Prevent caching on dynamic API routes.
    """
    if request.path.startswith('/static/') or request.path.startswith('/assets/') or request.path.endswith('.png') or request.path.endswith('.xml') or request.path.endswith('.txt'):
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    else:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    return response

@app.route('/api/config')
def get_client_config():
    """
    Expose public configuration vectors dynamically.
    Enables API security by avoiding hardcoding keys in built files.
    """
    return jsonify({
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY')
    })

@app.route('/api/pexels/videos')
def pexels_videos_proxy():
    """
    Pexels API Proxy (Proxy Pattern).
    Shields the PEXELS_API_KEY from exposure in client-side code.
    """
    query = request.args.get('query', 'starry night')
    pexels_key = os.getenv('PEXELS_API_KEY')
    
    if not pexels_key:
        logger.warning("PEXELS_API_KEY not found in environment.")
        return jsonify({"videos": []})
        
    try:
        url = "https://api.pexels.com/videos/search"
        params = {
            "query": query,
            "per_page": 15,
            "orientation": "landscape"
        }
        headers = {
            "Authorization": pexels_key
        }
        # Fetch from Pexels securely on the server side
        response = requests.get(url, params=params, headers=headers, timeout=5)
        return jsonify(response.json())
    except Exception as e:
        logger.error(f"Pexels Proxy Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/search')
def search():
    query = request.args.get('q')
    if not query:
        return jsonify([])
    results = openmeteo.search_city(query)
    return jsonify(results)

from concurrent.futures import ThreadPoolExecutor

def generate_weather_insights(temp, aqi, rain_chance):
    insights = []
    if aqi and aqi > 100:
        insights.append("Air quality is poor. Wear a mask if stepping out.")
    elif aqi and aqi > 50:
        insights.append("Moderate air quality. Sensitive groups should monitor symptoms.")
    
    if rain_chance and rain_chance > 60:
        insights.append("Carry an umbrella! Rain is likely today.")
    elif rain_chance and rain_chance > 30:
        insights.append("Subtle cloud condensation; slight chance of light rain.")
        
    if temp and temp > 35:
        insights.append("High thermal index. Stay hydrated and avoid long exposure.")
    elif temp and temp < 10:
        insights.append("Low temperature. Keep warm and monitor thermal systems.")
        
    return insights if insights else ["Atmospheric conditions are stable. Enjoy your day!"]

@app.route('/api/get_weather')
def get_weather():
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        city_name = request.args.get('city', 'Unknown Location')
        
        if not lat or not lon:
            return jsonify({'error': 'Missing coordinates'}), 400

        metadata_only = request.args.get('metadata_only') == 'true'

        if metadata_only:
            # OPTIMIZATION: Only fetch News (and potentially other non-rate-limited data)
            with ThreadPoolExecutor(max_workers=2) as executor:
                future_news = executor.submit(openmeteo.get_news_feed)
                news = future_news.result()
            
            return jsonify({
                'news': news,
                'history': "Historical synchronization deferred to minimize IP load."
            })

        # Execute API calls in parallel to maximize performance
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_forecast = executor.submit(openmeteo.get_forecast_data, lat, lon)
            future_aqi = executor.submit(openmeteo.get_air_quality_data, lat, lon)
            future_news = executor.submit(openmeteo.get_news_feed)

            # Wait for forecast as it's needed for historical trend
            forecast = future_forecast.result()
            logger.info(f"Open-Meteo Response: {forecast}")

            if not forecast:
                return jsonify({'error': 'Failed to fetch forecast'}), 500
            
            if 'error' in forecast:
                logger.error(f"Open-Meteo API Error: {forecast}")
                return jsonify({'error': f"Atmospheric Link Error: {forecast.get('reason', 'Unknown API Error')}"}), 502

            current_raw = forecast.get('current', forecast.get('current_weather', {}))
            
            if not current_raw:
                logger.error(f"Critical Error: 'current' block missing in response. Response: {forecast}")
                return jsonify({'error': 'Meteorological stream interrupted: Current data unavailable in API response.'}), 500
            
            current_weather = {
                'time': current_raw.get('time'),
                'temperature': current_raw.get('temperature_2m', current_raw.get('temperature')),
                'humidity': current_raw.get('relative_humidity_2m', current_raw.get('relative_humidity')),
                'weathercode': current_raw.get('weather_code', current_raw.get('weathercode')),
                'windspeed': current_raw.get('wind_speed_10m', current_raw.get('windspeed')),
                'windSpeed': current_raw.get('wind_speed_10m', current_raw.get('windspeed')),
                'winddirection': current_raw.get('wind_direction_10m', current_raw.get('winddirection')),
                'is_day': current_raw.get('is_day'),
                'pressure': current_raw.get('surface_pressure', current_raw.get('pressure'))
            }
            
            hourly_raw = forecast.get('hourly', {})
            hourly = {
                'time': hourly_raw.get('time'),
                'temperature_2m': hourly_raw.get('temperature_2m'),
                'relativehumidity_2m': hourly_raw.get('relative_humidity_2m', hourly_raw.get('relativehumidity_2m')),
                'apparent_temperature': hourly_raw.get('apparent_temperature'),
                'precipitation_probability': hourly_raw.get('precipitation_probability'),
                'precipitation': hourly_raw.get('precipitation'),
                'weathercode': hourly_raw.get('weather_code', hourly_raw.get('weathercode')),
                'visibility': hourly_raw.get('visibility'),
                'surface_pressure': hourly_raw.get('surface_pressure'),
                'windspeed_10m': hourly_raw.get('wind_speed_10m', hourly_raw.get('windspeed_10m')),
                'uv_index': hourly_raw.get('uv_index'),
                'soil_temperature_0cm': hourly_raw.get('soil_temperature_0cm'),
                'soil_moisture_0_to_1cm': hourly_raw.get('soil_moisture_0_to_1cm'),
                'soil_moisture_1_to_3cm': hourly_raw.get('soil_moisture_1_to_3cm')
            }

            daily_raw = forecast.get('daily', {})
            daily = {
                'time': daily_raw.get('time'),
                'weathercode': daily_raw.get('weather_code', daily_raw.get('weathercode')),
                'temperature_2m_max': daily_raw.get('temperature_2m_max'),
                'temperature_2m_min': daily_raw.get('temperature_2m_min'),
                'sunrise': daily_raw.get('sunrise'),
                'sunset': daily_raw.get('sunset')
            }
            
            future_history = executor.submit(openmeteo.get_historical_trend, lat, lon, current_weather['temperature'])
            
            history_text = future_history.result()
            aqi_data = future_aqi.result()
            news = future_news.result()
            
            # Extract AQI
            european_aqi_list = aqi_data.get('hourly', {}).get('european_aqi', []) if aqi_data else []
            aqi = european_aqi_list[0] if european_aqi_list else 0

            # Extract precipitation probability
            precipitation_probability_list = hourly.get('precipitation_probability', [])
            rain_chance = max(precipitation_probability_list[:12]) if precipitation_probability_list else 0
            
            insights = generate_weather_insights(current_weather['temperature'], aqi, rain_chance)
        
        return jsonify({
            'city': city_name,
            'current': current_weather,
            'hourly': hourly,
            'daily': daily,
            'history': history_text,
            'air_quality': aqi_data['hourly'] if aqi_data else None,
            'news': news,
            'insights': insights
        })

    except Exception as e:
        logger.error(f"Server Error: {e}")
        return jsonify({'error': str(e)}), 500


# Email Configuration (Requires App Password for Security)
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
MAIL_USERNAME = 'vyamir.app@gmail.com'
MAIL_PASSWORD = os.getenv('GMAIL_APP_PASSWORD')

if not MAIL_PASSWORD:
    logger.warning('GMAIL_APP_PASSWORD not found in environment.')

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import make_msgid

@app.route('/api/send_email', methods=['POST'])
def send_email():
    data = request.json
    user_name = data.get('name', 'User')
    user_email = data.get('email')
    message_body = data.get('message')

    username = MAIL_USERNAME.strip()
    msg = MIMEMultipart()
    msg['From'] = f'"Vyamir Support: {user_name}" <{username}>'
    msg['To'] = username
    msg['Reply-To'] = user_email
    msg['Subject'] = f"[Vyamir Dispatch] New Ticket from {user_name}"
    msg['Message-ID'] = make_msgid()

    # EXACT USER HTML TEMPLATE
    html_body = f"""
    <div style="font-family: sans-serif; background-color: #f4f4f7; padding: 40px 20px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #0d1117; color: #58a6ff; padding: 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 600;">Vyamir Systems</h1>
          <p style="margin: 5px 0 0 0; color: #8b949e; font-size: 14px; letter-spacing: 1px;">Atmospheric Data Dispatch</p>
        </div>
        <div style="padding: 35px;">
          <h2 style="color: #0d1117; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; margin-top: 0; font-weight: 600;">New Inquiry Received</h2>
          <div style="margin: 20px 0; font-size: 15px; line-height: 1.6;">
            <p style="margin: 8px 0;"><strong>Sender Name:</strong> <span style="color: #555;">{user_name}</span></p>
            <p style="margin: 8px 0;"><strong>Sender Email:</strong> <span style="color: #555;">{user_email}</span></p>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid #58a6ff; font-style: italic; margin: 25px 0; color: #2c3e50; line-height: 1.5;">
            "{message_body}"
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            You can reply directly to this email to contact the user.
          </p>
        </div>
        <div style="background: #f4f4f7; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #efefef;">
          This message was transmitted via <strong>Vyamir Web Dashboard</strong>.
        </div>
      </div>
    </div>
    """
    
    msg.attach(MIMEText(html_body, 'html'))

    try:
        username = MAIL_USERNAME.strip()
        password = MAIL_PASSWORD.strip()

        if 'YOUR_APP_PASSWORD' in password:
            logger.info("Email skipped: Password not configured in app.py")
            return jsonify({"status": "skipped", "message": "Email config missing"}), 200

        logger.info(f"Attempting SMTP connection to {SMTP_SERVER}:{SMTP_PORT}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.set_debuglevel(1)
        server.starttls()
        
        logger.info(f"Logging in as {username}...")
        try:
            server.login(username, password)
            logger.info("SMTP Login Successful!")
            server.send_message(msg)
            logger.info(f"Email DISPATCHED to {username} successfully!")
            server.quit()
            return jsonify({"status": "success", "message": "Email sent"})
        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error(f"SMTP Authentication Error: {auth_err}")
            return jsonify({
                "status": "error", 
                "message": f"Google Blocked Login: {str(auth_err)}"
            }), 500
        except Exception as smtp_err:
            logger.error(f"SMTP Send Error: {smtp_err}")
            return jsonify({"status": "error", "message": f"SMTP Dispatch Failed: {str(smtp_err)}"}), 500

    except Exception as e:
        logger.error(f"General Email Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/robots.txt')
def robots():
    return send_from_directory('public', 'robots.txt')

@app.route('/sitemap.xml')
def static_from_root():
    return send_from_directory('public', 'sitemap.xml', mimetype='application/xml')

@app.route('/ads.txt')
def ads_txt():
    return send_from_directory('public', 'ads.txt')

@app.route('/logo.png')
def logo_png():
    return send_from_directory('public', 'logo.png')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('public', 'logo.png', mimetype='image/png')


# --- STATIC ASSETS & SPA ROUTING FOR REACT ---

@app.route('/assets/<path:path>')
def serve_assets(path):
    """
    Serve React application bundle files (JS, CSS, images).
    """
    return send_from_directory(os.path.join(FRONTEND_DIST, 'assets'), path)

@app.route('/apidocs')
def serve_apidocs():
    """
    Serves the OpenAPI Swagger documentation page.
    """
    return render_template('apidocs.html')

@app.route('/index.html')
@app.route('/')
@app.route('/maps')
@app.route('/news')
@app.route('/agri')
@app.route('/monsoon')
@app.route('/privacy-settings')
@app.route('/privacy')
@app.route('/terms')
@app.route('/about')
@app.route('/contact')
@app.route('/cookie-policy')
def serve_index():
    """
    Serves the React application or legacy HTML templates for specific paths.
    """
    config = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY')
    }
    path = request.path.strip('/')
    
    # Force legacy templates for maps and news
    if path in ['maps', 'news']:
        return render_template(f'{path}.html', config=config)
        
    if not os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
        if not path or path == 'index.html':
            return render_template('index.html', config=config)
        elif path in ['agri', 'monsoon']:
            return render_template(f'{path}.html', config=config)
        return render_template('index.html', config=config)
        
    return send_from_directory(FRONTEND_DIST, 'index.html')

@app.route('/<path:path>')
def serve_fallback(path):
    """
    Catch-all route. Serve file from build output if it exists,
    otherwise fallback to index.html to allow React Router / client-side SPA routing.
    """
    if os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, 'index.html')


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 8080)), host='0.0.0.0', debug=True)
