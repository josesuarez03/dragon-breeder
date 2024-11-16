from playwright.sync_api import sync_playwright

def test_homepage_load():
    with sync_playwright() as p:
        # Configuración del navegador
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navegar a la página de inicio
        page.goto("http://localhost:3000/")

        # Verificar que los botones de login y registro están presentes
        assert page.is_visible("a[href='/login']")
        assert page.is_visible("a[href='/register']")

        # Cerrar navegador
        browser.close()
