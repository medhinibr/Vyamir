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
