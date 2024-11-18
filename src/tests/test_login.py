from playwright.sync_api import sync_playwright

def test_user_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navegar a la página de inicio de sesión
        page.goto("http://localhost:3000/login")

        # Llenar los campos de inicio de sesión
        page.fill("input[name='username']", "testuser")  # Ajusta si no tienes un name="username"
        page.fill("input[name='password']", "securepassword123")  # Ajusta si no tienes un name="password"

        # Hacer clic en el botón de inicio de sesión
        page.click("button.btn-primary")  # Selecciona el botón por su clase

        # Tomar una captura de pantalla para verificar el estado
        page.screenshot(path="tests/assets/login.png")

        # Cerrar el navegador
        browser.close()

def test_navigation_links():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navegar a la página de inicio de sesión
        page.goto("http://localhost:3000/login")

        # Verificar el enlace de registro
        page.click("a.register-link")
        assert page.url == "http://localhost:3000/register"

        # Volver a la página de inicio de sesión
        page.goto("http://localhost:3000/login")

        # Verificar el enlace de cambio de contraseña
        page.click("a.change-password-link")
        assert page.url == "http://localhost:3000/change-password"

        browser.close()
