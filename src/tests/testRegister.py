from playwright.sync_api import sync_playwright

def test_user_register():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navega a la pagina de register
        page.goto("http://localhost:3000/register")

        # Llenar los campos del formulario
        page.fill("#username", "testuser")  # Rellena el campo de usuario
        page.fill("#email", "testuser@example.com")  # Rellena el campo de correo electrónico
        page.fill("#password", "securepassword123")  # Rellena el campo de contraseña

        # Hacer clic en el botón de registro
        page.click("button.btn-primary")  # Selecciona el botón usando su clase

        # Verificar redirección (por ejemplo, a la página de inicio de sesión)
        page.wait_for_url("http://localhost:3000/login")

        # Opcional: Verificar que aparece un mensaje de éxito (si existe)
        assert "Inicia sesión ahora" in page.text_content("body")

        # Tomar una captura de pantalla para verificar el estado
        page.screenshot(path="register_success.png")
        browser.close()

def test_register_link_to_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navegar a la página de registro
        page.goto("http://localhost:3000/register")

        # Hacer clic en el enlace de inicio de sesión
        page.click("a.register-link")  # Selecciona el enlace por su clase

        # Verificar redirección a la página de inicio de sesión
        page.wait_for_url("http://localhost:3000/login")

        browser.close()
