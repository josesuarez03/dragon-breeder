import os
import time
import pymongo
import requests
from typing import Tuple
import logging
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
url = os.getenv('BASE_URL')

def get_mongodb_uri() -> str:

    host = os.getenv('MONGO_HOST')
    port = os.getenv('MONGO_PORT')
    db = os.getenv('MONGO_DB')
    user = os.getenv('MONGO_USER')
    password = os.getenv('MONGO_PASSWORD')
    
    return f"mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin"

def wait_for_services(app_url: str = url) -> Tuple[bool, bool]:

    mongodb_uri = get_mongodb_uri()
    mongodb_ready = wait_for_mongodb(mongodb_uri)
    webapp_ready = wait_for_webapp(app_url)
    
    return mongodb_ready, webapp_ready

def wait_for_mongodb(uri: str) -> bool:

    max_tries = 30
    current_try = 0
    
    while current_try < max_tries:
        try:
            logger.info(f"Intentando conectar a MongoDB (intento {current_try + 1})")
            client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
            # Verificar la conexión
            client.admin.command('ismaster')
            # Verificar acceso a la base de datos específica
            db_name = os.getenv('MONGO_DB')
            db = client[db_name]
            db.list_collection_names()
            logger.info("✓ MongoDB está disponible y las credenciales son correctas")
            return True
        except Exception as e:
            logger.warning(f"MongoDB no disponible o error de autenticación: {str(e)}")
            current_try += 1
            time.sleep(1)
    
    logger.error("× No se pudo conectar a MongoDB después de 30 intentos")
    return False

def wait_for_webapp(url: str = url) -> bool:

    max_tries = 30
    current_try = 0
    
    while current_try < max_tries:
        try:
            logger.info(f"Verificando disponibilidad de la webapp (intento {current_try + 1})")
            response = requests.get(url)
            if response.status_code == 200:
                logger.info("✓ Aplicación web está disponible")
                return True
            logger.warning(f"Aplicación web respondió con status code: {response.status_code}")
        except requests.RequestException as e:
            logger.warning(f"Aplicación web no disponible: {str(e)}")
        current_try += 1
        time.sleep(1)
    
    logger.error("× No se pudo conectar a la aplicación web después de 30 intentos")
    return False

if __name__ == "__main__":
    # Prueba manual del health check
    mongodb_ready, webapp_ready = wait_for_services()
    print(f"MongoDB ready: {mongodb_ready}")
    print(f"Webapp ready: {webapp_ready}")