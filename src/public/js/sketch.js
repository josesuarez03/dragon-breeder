let mapDay, mapNight;
let dragon;
let characters = [];
let timeMode;

let playerX = 400;
let playerY = 400;
const PLAYER_SPEED = 5;

function preload() {
    mapDay = loadImage('./assets/MapaClaro.webp');
    mapNight = loadImage('./assets/MapaOscuro.webp');
    dragon = loadImage('./sprites/dragons/chicken.png');
    loadCharacters();
}

function setup() {
    const canvas = createCanvas(800, 800);
    canvas.parent('canvasContainer');
    
    // Obtener el modo de tiempo guardado o usar el predeterminado
    timeMode = localStorage.getItem('timeMode') || 'system';
    
    // Hacer la función updateTimeMode disponible globalmente
    window.updateTimeMode = function(newMode) {
        timeMode = newMode;
    };
}

function draw() {
    background(220);
    
    // Determinar qué mapa mostrar según el modo y la hora
    let currentMap = determineCurrentMap();
    image(currentMap, 0, 0, 800, 800);
    
    // Dibujar personajes
    for (let char of characters) {
        if (char.image) {
            image(char.image, char.x, char.y, 50, 50);
        } else {
            image(dragon, char.x, char.y, 50, 50);
        }
    }
    
    // Dibujar el personaje del jugador
    image(dragon, playerX, playerY, 50, 50);
    
    handleMovement();
}

function determineCurrentMap() {
    if (timeMode === 'day') {
        return mapDay;
    } else if (timeMode === 'night') {
        return mapNight;
    } else {
        // Modo sistema: usar la hora actual
        const currentHour = new Date().getHours();
        return (currentHour >= 6 && currentHour < 18) ? mapDay : mapNight;
    }
}

function handleMovement() {
    if (keyIsDown(LEFT_ARROW) && playerX > 0) {
        playerX -= PLAYER_SPEED;
    }
    if (keyIsDown(RIGHT_ARROW) && playerX < width - 50) {
        playerX += PLAYER_SPEED;
    }
    if (keyIsDown(UP_ARROW) && playerY > 0) {
        playerY -= PLAYER_SPEED;
    }
    if (keyIsDown(DOWN_ARROW) && playerY < height - 50) {
        playerY += PLAYER_SPEED;
    }
}

async function loadCharacters() {
    try {
        const response = await fetch('online-characters');
        const data = await response.json();
        
        characters = data.map(user => ({
            image: user.characterImage ? loadImage(user.characterImage) : null,
            x: user.x || random(800),
            y: user.y || random(800)
        }));
    } catch (error) {
        console.error("Error al cargar los personajes:", error);
        characters = [];
    }
}