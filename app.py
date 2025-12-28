from flask import Flask, render_template, request, jsonify, send_from_directory
from backend import openmeteo
import os
import math

app = Flask(__name__)

@app.route('/')
@app.route('/privacy')
@app.route('/terms')
@app.route('/about')
@app.route('/contact')
@app.route('/cookie-policy')
@app.route('/privacy-settings')
def index():
    return render_template('index.html')

@app.route('/ads.txt')
def serve_ads():
    return send_from_directory('static', 'ads.txt')

@app.route('/robots.txt')
def serve_robots():
    return send_from_directory('static', 'robots.txt')

@app.route('/sitemap.xml')
def serve_sitemap():
    return send_from_directory('static', 'sitemap.xml')

@app.route('/logo.png')
def logo_png():
    return send_from_directory('static/img', 'logo.png')

@app.route('/api/search')
def search():
    query = request.args.get('q')
    if not query:
        return jsonify([])
    results = openmeteo.search_city(query)
    return jsonify(results)

from concurrent.futures import ThreadPoolExecutor

@app.route('/api/get_weather')
def get_weather():
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        city_name = request.args.get('city', 'Unknown Location')
        
        if not lat or not lon:
            return jsonify({'error': 'Missing coordinates'}), 400

        # Execute API calls in parallel to maximize performance
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_forecast = executor.submit(openmeteo.get_forecast_data, lat, lon)
            future_aqi = executor.submit(openmeteo.get_air_quality_data, lat, lon)
            future_news = executor.submit(openmeteo.get_news_feed)

            # Wait for forecast as it's needed for historical trend
            forecast = future_forecast.result()
            if not forecast:
                return jsonify({'error': 'Failed to fetch forecast'}), 500
            
            current_weather = forecast['current_weather']
            
            # Historical trend needs current temp, so we run it after forecast starts or completes
            future_history = executor.submit(openmeteo.get_historical_trend, lat, lon, current_weather['temperature'])
            
            # Collect results
            history_text = future_history.result()
            aqi_data = future_aqi.result()
            news = future_news.result()
        
        return jsonify({
            'city': city_name,
            'current': current_weather,
            'hourly': forecast['hourly'],
            'daily': forecast['daily'],
            'history': history_text,
            'air_quality': aqi_data['hourly'] if aqi_data else None,
            'news': news
        })

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({'error': str(e)}), 500


# Email Configuration (Requires App Password for Security)
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
MAIL_USERNAME = 'vyamir.app@gmail.com' 
MAIL_PASSWORD = 'vxkw fpmp xdda tcot' 

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

    msg = MIMEMultipart()
    msg['From'] = f'"Vyamir Support: {user_name}" <{MAIL_USERNAME}>'
    msg['To'] = MAIL_USERNAME
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
        # Sanitize credentials
        username = MAIL_USERNAME.strip()
        password = MAIL_PASSWORD.strip()

        # Check for placeholder
        if 'YOUR_APP_PASSWORD' in password:
            print("Email skipped: Password not configured in app.py")
            return jsonify({"status": "skipped", "message": "Email config missing"}), 200

        print(f"Attempting SMTP connection to {SMTP_SERVER}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        
        print(f"Logging in as {username}...")
        try:
            server.login(username, password)
            print("SMTP Login Successful!")
            
            # Send message using the MIMEMultipart object
            server.send_message(msg)
            print(f"Email DISPATCHED to {username} successfully!")
            
            server.quit()
            return jsonify({"status": "success", "message": "Email sent"})
        except smtplib.SMTPAuthenticationError as auth_err:
            print("\n" + "="*60)
            print("GOOGLE SECURITY ERROR: Standard passwords are BLOCKED.")
            print("You MUST generate an 'App Password' for Vyamir.")
            print("1. Go here: https://myaccount.google.com/apppasswords")
            print("2. Name it 'Vyamir'")
            print("3. Copy the 16-character code")
            print("4. Paste it into app.py (MAIL_PASSWORD)")
            print("="*60 + "\n")
            return jsonify({
                "status": "error", 
                "message": "Google Blocked Login. Check Terminal for Help Link."
            }), 500


    except Exception as e:
        print(f"General Email Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500



if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 8080)), host='0.0.0.0', debug=True)
