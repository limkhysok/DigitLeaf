"""
Locust load test for the sack_registration endpoints.

Run (from backend/, with the API already running, e.g. uvicorn app.main:app):

    set LOCUST_USERNAME=your_username   (PowerShell: $env:LOCUST_USERNAME="...")
    set LOCUST_PASSWORD=your_password
    locust -f locustfile.py --host=http://localhost:8000

Then open http://localhost:8089, set number of users / spawn rate, and start.
The user account must have the "login_system" scope/permission, since every
sack-registration endpoint requires it.
"""
import os
import random
from datetime import date, timedelta
from locust import HttpUser, task, between

USERNAME = os.environ.get("LOCUST_USERNAME", "")
PASSWORD = os.environ.get("LOCUST_PASSWORD", "")

SEARCH_TERMS = ["", "a", "01", "farm"]


class SackRegistrationUser(HttpUser):
    wait_time = between(0.5, 2)

    def on_start(self):
        resp = self.client.post(
            "/api/v1/auth/login/access-token",
            data={"username": USERNAME, "password": PASSWORD},
        )
        resp.raise_for_status()
        token = resp.json()["access_token"]
        self.client.headers.update({"Authorization": f"Bearer {token}"})

    @task(5)
    def list_default(self):
        self.client.get(
            "/api/v1/sack-registrations/",
            params={"page": random.randint(1, 5), "limit": 20},
            name="/sack-registrations [list]",
        )

    @task(3)
    def list_with_search(self):
        self.client.get(
            "/api/v1/sack-registrations/",
            params={"page": 1, "limit": 20, "search": random.choice(SEARCH_TERMS)},
            name="/sack-registrations [search]",
        )

    @task(3)
    def list_with_date_range(self):
        today = date.today()
        self.client.get(
            "/api/v1/sack-registrations/",
            params={
                "page": 1,
                "limit": 20,
                "date_from": (today - timedelta(days=30)).isoformat(),
                "date_to": today.isoformat(),
            },
            name="/sack-registrations [date-range]",
        )

    @task(3)
    def list_sorted_by_sack_kg(self):
        self.client.get(
            "/api/v1/sack-registrations/",
            params={"page": 1, "limit": 20, "sort_sack_in_kg": random.choice(["asc", "desc"])},
            name="/sack-registrations [sorted]",
        )

    @task(4)
    def stats(self):
        self.client.get("/api/v1/sack-registrations/stats", name="/sack-registrations/stats")
