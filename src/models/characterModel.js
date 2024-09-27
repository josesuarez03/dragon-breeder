const fs = require('fs');
const path = require('path');

const dragonsFilePath = path.join(__dirname, '../data/dragons.json')

const DragonSprite = path.join(__dirname, '../public/sprites/dragons');
const eggsSprite = path.join(__dirname, '../public/sprites/eggs');

const eggProbabilityHatch = 0.8;

const getAllDragons = () => {
    return JSON.parse(fs.readFileSync(dragonsFilePath, 'utf-8'));
};

const saveDragons = (dragons) => {
    fs.writeFileSync(path, JSON.stringify(dragons, null, 2));
};

const findDragonsById = (id) => {
    const characters = getAllDragons();
    return characters.find(c => c.id === id);
};

// Guardar un personaje específico
const saveDragon = (updatedCharacter) => {
    const characters = getAllCharacters();
    const index = characters.findIndex(c => c.id === updatedCharacter.id);
    if (index !== -1) {
        characters[index] = updatedCharacter;
        saveDragons(characters);
    }
};

const checkAvalaibleBattleDragon = (dragon) => {
    if (dragon.hungry >= 80 && dragon.energy >= 80 && dragon.health >= 80){
        return true;
    }
};


const breedDragons = (dragon1, dragon2, dragon3)

const regenerateAttributes = (dragon, action) => {

    if (action === 'feed') {
        dragon.hungry = Math.min(dragon.hungry + 30, 100);
    } else if (action === 'rest') {
        dragon.energy = Math.min(dragon.energy + 40, 100);
    } else if (action === 'heal') {
        dragon.health = Math.min(dragon.health + 50, 100);
    }

    dragon.disponibleParaLuchar = checkAvalaibleBattleDragon(dragon);
    return dragon;
};

// Generar dragón con características aleatorias
const generateRandomDragon = () => {
    return {
        id: Date.now(),
        name: `Dragón ${Math.floor(Math.random() * 1000)}`,
        hambre: Math.random() * 100, // Valor entre 0 y 100
        energia: Math.random() * 100,
        salud: Math.random() * 100,
        velocidad: Math.floor(Math.random() * 100),
        agilidad: Math.floor(Math.random() * 100),
        fuerza: Math.floor(Math.random() * 100),
        habilidadesEspeciales: Math.random() > 0.5,
        inteligencia: Math.floor(Math.random() * 100),
        defensa: Math.floor(Math.random() * 100),
        ataque: Math.floor(Math.random() * 100),
        disponibleParaLuchar: false,
        imageUrl: '/path/to/default-dragon.jpg' // Imagen por defecto
    };
}

const characterModel = {
    getAllCharacters: getAllDragons,

    findCharacterById: (id) => {
        const dragons = getAllDragons();
        return dragons.find(dragon => dragon.id === id);
    },

    saveCharacters: saveDragons,

    regenerateDragonAttributes: (dragonId, action) => {
        let dragons = getAllDragons();
        const dragonIndex = dragons.findIndex(d => d.id === dragonId);
        if (dragonIndex >= 0) {
            const updatedDragon = regenerateAttributes(dragons[dragonIndex], action);
            dragons[dragonIndex] = updatedDragon;
            saveDragons(dragons);
            return updatedDragon;
        }
        return null;
    },

    generateRandomDragon,

    updateDragon: (id, updatedData, imageUrl) => {
        let dragons = getAllDragons();
        const dragonIndex = dragons.findIndex(d => d.id === id);
        if (dragonIndex >= 0) {
            dragons[dragonIndex] = { ...dragons[dragonIndex], ...updatedData };
            
            if (imageUrl) {
                dragons[dragonIndex].imageUrl = imageUrl;
            }
            
            dragons[dragonIndex].disponibleParaLuchar = checkDisponibilidadParaLuchar(dragons[dragonIndex]);
            saveDragons(dragons);
            return dragons[dragonIndex];
        }
        return null;
    },

    deleteDragon: (id) => {
        let dragons = getAllDragons();
        dragons = dragons.filter(dragon => dragon.id !== id);
        saveDragons(dragons);
    }
};

module.exports = characterModel;