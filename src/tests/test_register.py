from playwright.sync_api import sync_playwright, expect
import time

def test_user_register():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navega a la página de register
            page.goto("http://localhost:3000/register")
            
            # Esperar a que el formulario esté visible
            page.wait_for_selector("#username")

            # Llenar los campos del formulario
            page.fill("#username", "testuser")
            page.fill("#email", "testuser@example.com")
            page.fill("#password", "securepassword123")

            # Hacer clic en el botón de registro
            page.click("button.btn-primary")

            # Verificar si redirige a cualquiera de las dos rutas posibles
            try:
                # Primero intentamos esperar la ruta /game
                page.wait_for_url("http://localhost:3000/game", timeout=5000)
                current_route = "game"
            except:
                try:
                    # Si no es /game, esperamos que sea /box-egg
                    page.wait_for_url("http://localhost:3000/box-egg", timeout=5000)
                    current_route = "box-egg"
                except:
                    raise AssertionError("No se redirigió ni a /game ni a /box-egg")

            # Esperar a que la página se cargue completamente
            page.wait_for_load_state("networkidle")

            # Verificar que estamos en una de las rutas esperadas
            assert current_route in ["game", "box-egg"], f"La redirección a {current_route} no es válida"

            # Verificar que existe la clase container
            container_exists = page.locator(".container").count() > 0
            assert container_exists, "No se encontró la clase .container en la página"

            # Tomar una captura de pantalla del estado final
            page.screenshot(path=f"tests/assets/register_to_{current_route}_success.png")

            print(f"✓ Registro exitoso: Redirigido a /{current_route}")
            print(f"✓ Clase .container encontrada en la página")

        except Exception as e:
            # Tomar una captura de pantalla en caso de error
            page.screenshot(path="tests/assets/register_error.png")
            raise e

        finally:
            context.close()
            browser.close()

def test_register_link_to_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navegar a la página de registro
            page.goto("http://localhost:3000/register")

            # Esperar a que el enlace esté visible
            page.wait_for_selector("a.register-link")

            # Hacer clic en el enlace de inicio de sesión
            page.click("a.register-link")

            # Esperar a que la navegación se complete
            page.wait_for_url("http://localhost:3000/login", timeout=10000)
            
            # Esperar a que la página se cargue completamente
            page.wait_for_load_state("networkidle")

        finally:
            context.close()
            browser.close()

def clean_test_user(mongo_client):
    try:
        db = mongo_client.get_database("testdb")
        
        # Primero obtenemos el _id del usuario para referencias
        users_collection = db.get_collection("users")
        test_user = users_collection.find_one({"username": "testuser"})
        
        if test_user:
            user_id = test_user["_id"]
            
            # Limpiamos el usuario
            users_collection.delete_one({"_id": user_id})
            
            # Limpiamos la sesión
            sessions_collection = db.get_collection("sessions")
            sessions_collection.delete_many({"userId": user_id})
            
            # Limpiamos los dragones
            dragons_collection = db.get_collection("dragons")
            dragons_collection.delete_many({"userId": user_id})
            
            # Limpiamos el estado del juego
            gamestate_collection = db.get_collection("gamestate")
            gamestate_collection.delete_many({"userId": user_id})
            
            print("✓ Datos de prueba limpiados correctamente:")
            print("  - Usuario eliminado")
            print("  - Sesiones eliminadas")
            print("  - Dragones eliminados")
            print("  - Estado del juego eliminado")
        else:
            print("ℹ No se encontró el usuario de prueba para limpiar")
            
    except Exception as e:
        print(f"❌ Error al limpiar datos de prueba: {e}")