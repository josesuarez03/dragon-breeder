# Definición de variables básicas
NPM = npm
SLEEP = sleep 5
TEST_DIR = tests
PYTHON = python
PIP = pip
CONDA_ENV = test-dragon
DOCKER_COMPOSE = docker compose

# Colores para mensajes
GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[1;33m
NC = \033[0m # No Color

# Cargar variables de entorno desde archivo .env si existe
ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: install test server run docker-compose-up stop start clean setup-env install-deps mock-mongo help verify-env

# Target por defecto
all: verify-env setup-env install mock-mongo test

help:
	@echo "${YELLOW}Comandos disponibles:${NC}"
	@echo "  ${GREEN}make install${NC}         - Instala todas las dependencias"
	@echo "  ${GREEN}make test${NC}            - Ejecuta todas las pruebas"
	@echo "  ${GREEN}make server${NC}          - Inicia el servidor"
	@echo "  ${GREEN}make run${NC}             - Inicia la aplicación completa"
	@echo "  ${GREEN}make docker-compose-up${NC} - Levanta contenedor de MongoDB"
	@echo "  ${GREEN}make stop${NC}            - Detiene el contenedor de MongoDB"
	@echo "  ${GREEN}make start${NC}           - Inicia el contenedor de MongoDB"
	@echo "  ${GREEN}make clean${NC}           - Limpia archivos temporales"
	@echo "  ${GREEN}make mock-mongo${NC}      - Inicia MongoDB Mock"
	@echo "  ${GREEN}make setup-env${NC}       - Configura el ambiente de desarrollo"
	@echo "  ${GREEN}make verify-env${NC}      - Verifica variables de entorno"
	@echo "  ${GREEN}make activate-conda${NC}  - Iniciar el ambiente de desarrollo de conda"

# Verificación de variables de entorno
verify-env:
	@echo "${YELLOW}Verificando variables de entorno...${NC}"
	@if [ -z "$(MONGO_TEST_HOST)" ]; then \
		echo "${RED}Error: MONGO_TEST_HOST no está definida${NC}"; \
		exit 1; \
	fi
	@if [ -z "$(MONGO_TEST_PORT)" ]; then \
		echo "${RED}Error: MONGO_TEST_PORT no está definida${NC}"; \
		exit 1; \
	fi
	@if [ -z "$(MONGO_TEST_DB)" ]; then \
		echo "${RED}Error: MONGO_TEST_DB no está definida${NC}"; \
		exit 1; \
	fi
	@if [ -z "$(MONGO_TEST_USER)" ]; then \
		echo "${RED}Error: MONGO_TEST_USER no está definida${NC}"; \
		exit 1; \
	fi
	@if [ -z "$(MONGO_TEST_PASSWORD)" ]; then \
		echo "${RED}Error: MONGO_TEST_PASSWORD no está definida${NC}"; \
		exit 1; \
	fi
	@echo "${GREEN}Variables de entorno verificadas correctamente${NC}"

# Configuración del ambiente
setup-env:
	@echo "${YELLOW}Configurando ambiente de desarrollo...${NC}"
	conda create -n $(CONDA_ENV) python=3.9 -y || true
	conda activate $(CONDA_ENV) || true
	@echo "${GREEN}Ambiente configurado correctamente${NC}"

activate-conda:
	@echo "${YELLOW}Activando ambiente de desarrollo...${NC}"
	conda activate $(CONDA_ENV) || true
	@echo "${GREEN}Ambiente activado correctamente${NC}"

# Instalación de dependencias
install: setup-env
	@echo "${YELLOW}Instalando dependencias de Node.js...${NC}"
	$(NPM) install
	@echo "${YELLOW}Instalando dependencias de Python...${NC}"
	$(PIP) install -r requirements.txt
	playwright install --with-deps chromium
	@echo "${GREEN}Todas las dependencias instaladas correctamente${NC}"

# Ejecución de pruebas
test: verify-env run-tests

run-tests:
	@echo "${YELLOW}Ejecutando las pruebas de playwright${NC}"
	$(SLEEP)
	@echo "${YELLOW}Ejecutando pruebas en el home${NC}"
	MONGO_TEST_HOST=$(MONGO_TEST_HOST) \
	MONGO_TEST_PORT=$(MONGO_TEST_PORT) \
	MONGO_TEST_DB=$(MONGO_TEST_DB) \
	MONGO_TEST_USER=$(MONGO_TEST_USER) \
	MONGO_TEST_PASSWORD=$(MONGO_TEST_PASSWORD) \
	pytest -v $(TEST_DIR)/test_home.py
	$(SLEEP)
	@echo "${YELLOW}Ejecutando pruebas en el registro${NC}"
	MONGO_TEST_HOST=$(MONGO_TEST_HOST) \
	MONGO_TEST_PORT=$(MONGO_TEST_PORT) \
	MONGO_TEST_DB=$(MONGO_TEST_DB) \
	MONGO_TEST_USER=$(MONGO_TEST_USER) \
	MONGO_TEST_PASSWORD=$(MONGO_TEST_PASSWORD) \
	pytest -v $(TEST_DIR)/test_register.py
	$(SLEEP)
	@echo "${YELLOW}Ejecutando pruebas en el login${NC}"
	MONGO_TEST_HOST=$(MONGO_TEST_HOST) \
	MONGO_TEST_PORT=$(MONGO_TEST_PORT) \
	MONGO_TEST_DB=$(MONGO_TEST_DB) \
	MONGO_TEST_USER=$(MONGO_TEST_USER) \
	MONGO_TEST_PASSWORD=$(MONGO_TEST_PASSWORD) \
	pytest -v $(TEST_DIR)/test_login.py
	@echo "${GREEN}Pruebas completadas${NC}"

# Servidor y MongoDB
server:
	@echo "${YELLOW}Iniciando el servidor${NC}"
	$(NPM) start

mock-mongo: verify-env
	@echo "${YELLOW}Iniciando MongoDB Mock...${NC}"
	MONGO_TEST_HOST=$(MONGO_TEST_HOST) \
	MONGO_TEST_PORT=$(MONGO_TEST_PORT) \
	MONGO_TEST_DB=$(MONGO_TEST_DB) \
	MONGO_TEST_USER=$(MONGO_TEST_USER) \
	MONGO_TEST_PASSWORD=$(MONGO_TEST_PASSWORD) \
	python -c "from mongomock import MongoClient; client = MongoClient(); db = client['$(MONGO_TEST_DB)']" &
	@echo "${GREEN}MongoDB Mock iniciado${NC}"

# Docker comandos
docker-compose-up:
	@echo "${YELLOW}Levantando el contenedor de mongo${NC}"
	cd data && $(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Contenedor de MongoDB iniciado${NC}"

stop:
	@echo "${YELLOW}Parando el contenedor de mongo${NC}"
	docker stop data-mongodb-1
	@echo "${GREEN}Contenedor detenido${NC}"

start:
	@echo "${YELLOW}Iniciando el contenedor${NC}"
	docker start data-mongodb-1
	@echo "${GREEN}Contenedor iniciado${NC}"

# Limpieza
clean:
	@echo "${YELLOW}Limpiando archivos temporales...${NC}"
	rm -rf node_modules
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -f *.pyc
	rm -f *.pyo
	rm -f *.pyd
	rm -f .coverage
	rm -f coverage.xml
	@echo "${GREEN}Limpieza completada${NC}"

# Ejecución completa
run: docker-compose-up server
	@echo "${GREEN}Aplicación iniciada completamente${NC}"