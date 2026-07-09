from locust import HttpUser, task, between

class VyamirLoadTester(HttpUser):
    wait_time = between(1, 3)

    @task(1)
    def load_home(self):
        self.client.get("/")

    @task(2)
    def load_api_config(self):
        self.client.get("/api/config")

    @task(2)
    def load_weather_api(self):
        # Stress test weather proxy retrieval with coordinates for New Delhi
        self.client.get("/api/get_weather?lat=28.6139&lon=77.2090&city=New%20Delhi")
