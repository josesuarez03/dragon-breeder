from playwright.sync_api import sync_playwright
from pymongo import MongoClient
from utils.health_check import get_mongodb_uri

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

        clean_test_user()

        browser.close()

def clean_test_user(mongo_client):
    try:
        # Obtener la URI de conexión desde la función compartida
        uri = get_mongodb_uri()
        client = MongoClient(uri)
        db = client.get_database()  # Obtiene la base de datos predeterminada de la URI
        
        # Buscar y eliminar datos relacionados con el usuario 'testuser'
        users_collection = db.get_collection("users")
        test_user = users_collection.find_one({"username": "testuser"})
        
        if test_user:
            user_id = test_user["_id"]
            
            # Limpiar dependencias antes de eliminar el usuario
            collections_to_clean = {
                "sessions": {"userId": user_id},
                "dragons": {"userId": user_id},
                "gamestate": {"userId": user_id},
            }
            
            for collection_name, query in collections_to_clean.items():
                result = db.get_collection(collection_name).delete_many(query)
                print(f"  - {collection_name.capitalize()} eliminados: {result.deleted_count}")
            
            # Eliminar el usuario al final
            result = users_collection.delete_one({"_id": user_id})
            print(f"  - Usuario eliminado: {result.deleted_count}")
        else:
            print("ℹ No se encontró el usuario de prueba.")
    except Exception as e:
        print(f"❌ Error al limpiar datos de prueba: {e}")
    finally:
        client.close()