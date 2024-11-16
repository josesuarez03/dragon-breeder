import pytest
import os
from playwright.sync_api import Page
from utils.health_check import wait_for_services

@pytest.fixture(scope="session", autouse=True)
def ensure_services():
    mongodb_ready, webapp_ready = wait_for_services()
    assert mongodb_ready, "MongoDB no está disponible"
    assert webapp_ready, "La aplicación web no está disponible"

@pytest.fixture(scope="session")
def mongo_uri():
    host = os.getenv('MONGO_HOST')
    port = os.getenv('MONGO_PORT')
    db = os.getenv('MONGO_DB')
    user = os.getenv('MONGO_USER')
    password = os.getenv('MONGO_PASSWORD')
    
    return f"mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin"

@pytest.fixture(scope="session")
def base_url():
    return os.getenv('BASE_URL')

@pytest.fixture(scope="function")
async def page(page: Page, base_url: str):
    page.set_default_timeout(5000)
    page.set_default_navigation_timeout(10000)
    await page.goto(base_url)
    return page