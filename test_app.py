import pytest
from app import app as flask_app

@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client

def test_homepage(client):
    """Test that the index/dashboard route loads successfully."""
    response = client.get('/')
    assert response.status_code == 200

def test_api_config(client):
    """Test that the config API returns Firebase details."""
    response = client.get('/api/config')
    assert response.status_code == 200
    data = response.get_json()
    assert 'FIREBASE_API_KEY' in data

def test_legacy_maps(client):
    """Test that the maps route renders successfully."""
    response = client.get('/maps')
    assert response.status_code == 200

def test_legacy_news(client):
    """Test that the news route renders successfully."""
    response = client.get('/news')
    assert response.status_code == 200

def test_apidocs(client):
    """Test that the API documentation route renders successfully."""
    response = client.get('/apidocs')
    assert response.status_code == 200

def test_privacy_policy(client):
    """Test that the privacy policy route renders successfully."""
    response = client.get('/privacy')
    assert response.status_code == 200

def test_terms_conditions(client):
    """Test that the terms & conditions route renders successfully."""
    response = client.get('/terms')
    assert response.status_code == 200

def test_about_us(client):
    """Test that the about us route renders successfully."""
    response = client.get('/about')
    assert response.status_code == 200

def test_contact_support(client):
    """Test that the contact support route renders successfully."""
    response = client.get('/contact')
    assert response.status_code == 200

def test_cookie_policy(client):
    """Test that the cookie policy route renders successfully."""
    response = client.get('/cookie-policy')
    assert response.status_code == 200

def test_ads_txt(client):
    """Test that the ads.txt route returns the verification file."""
    response = client.get('/ads.txt')
    assert response.status_code == 200
    assert b"google.com" in response.data

def test_robots_txt(client):
    """Test that the robots.txt route is served."""
    response = client.get('/robots.txt')
    assert response.status_code == 200

def test_sitemap_xml(client):
    """Test that sitemap.xml is served."""
    response = client.get('/sitemap.xml')
    assert response.status_code == 200
