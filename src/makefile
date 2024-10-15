DOCKER_COMPOSE = docker-compose
NPM = npm
SLEEP = sleep 5

dockerUp:
	@echo "Levantando el contenedor de mongo"
	$(DOCKER_COMPOSE) up -d
	$(SLEEP)

dockerDown:
	@echo "Deteniendo el contenedor de mongo"
	$(DOCKER_COMPOSE) stop

server:
	@echo "Iniciando el servidor"
	$(NPM) start

run: dockerUp server
	@echo "Iniciando aplicación"

install:
	@echo "Instalando dependencias"
	$(NPM) install

