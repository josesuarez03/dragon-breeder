const fs = require('fs');
const path = require('path');

const dragonsFilePath = path.join(__dirname, '../data/dragons.json');

const dragonSpritesPath = path.join(__dirname, '../public/sprites/dragons');
const eggSpritesPath = path.join(__dirname, '../public/sprites/eggs');

const eggHatchingProbability = 0.8;

const getAllDragons = () => {
    return JSON.parse(fs.readFileSync(dragonsFilePath, 'utf-8'));
};

const saveDragons = (dragons) => {
    fs.writeFileSync(dragonsFilePath, JSON.stringify(dragons, null, 2));
};

const findDragonById = (id) => {
    const dragons = getAllDragons();
    return dragons.find(dragon => dragon.id === id);
};

const saveDragon = (updatedDragon) => {
    const dragons = getAllDragons();
    const index = dragons.findIndex(dragon => dragon.id === updatedDragon.id);
    if (index !== -1) {
        dragons[index] = updatedDragon;
        saveDragons(dragons);
    }
};

const selectEggImage = (type) => {
    const eggImages = fs.readdirSync(eggSpritesPath);
    const availableEggs = eggImages.filter(image => image.includes(type));
    return availableEggs[Math.floor(Math.random() * availableEggs.length)];
};

const selectDragonImage = () => {
    const dragonImages = fs.readdirSync(dragonSpritesPath);
    const availableDragon = dragonImages[Math.floor(Math.random() * dragonImages.length)];
    return availableDragon;
};

const selectMiniDragonImage = () => {
    const miniDragonImages = fs.readdirSync(dragonSpritesPath);
    const availableMiniDragon = miniDragonImages[Math.floor(Math.random() * miniDragonImages.length)];
    return availableMiniDragon;
};

const checkAvailableForBattle = (dragon) => {
    return dragon.hungry >= 80 && dragon.energy >= 80 && dragon.health >= 80;
};

const regenerateAttributes = (dragon, action) => {
    if (action === 'feed') {
        dragon.hungry = Math.min(dragon.hungry + 30, 100);
        dragon.energy = Math.min(dragon.energy + 20, 100);  // Energía también se restaura
    } else if (action === 'rest') {
        dragon.energy = Math.min(dragon.energy + 40, 100);
    } else if (action === 'heal') {
        dragon.health = Math.min(dragon.health + 50, 100);
    }

    dragon.availableForBattle = checkAvailableForBattle(dragon);
    return dragon;
};
const trainDragon = (dragon) => {
    const attributes = ['speed', 'strength', 'agility', 'intelligence', 'defense', 'attack'];

    attributes.forEach(attribute => {
        dragon[attribute] += 1; // Incrementar cada atributo en 1
    });

    saveDragon(dragon); // Asegúrate de guardar el dragón después de entrenarlo
};

/*const blackDragon = {
    egg: '/public/sprites/eggs/egg3.png',
    mini: '/public/sprites/dragons/mini-dragon3.png',
    adult: '/public/sprites/dragons/adult-dragon3.png'
};

const greenDragon = {
    egg: '/public/sprites/eggs/egg.png',
    mini: '/public/sprites/dragons/mini-dragon.png',
    adult: '/public/sprites/dragons/adult-dragon.png'
};

const orangeDragon = {
    egg: '/public/sprites/eggs/egg2.png',
    mini: '/public/sprites/dragons/mini-dragon2.png',
    adult: '/public/sprites/dragons/adult-dragon2.png'
};

const chicken = {
    egg: '/public/sprites/eggs/egg4.png',
    adult: '/public/sprites/dragons/chicken.png'
};*/


const breedDragons = (dragon1, dragon2) => {
    if (dragon1.type === 'chicken' || dragon2.type === 'chicken' || dragon1.type === dragon2.type) {
        const eggImage = selectEggImage(dragon1.type === 'chicken' || dragon2.type === 'chicken' ? 'chicken' : 'dragon');
        
        const newEgg = {
            id: Date.now(),
            name: 'Mystery Egg',
            type: 'egg',
            stage: 'egg',
            imageUrl: `/public/sprites/eggs/${eggImage}`,
            hungry: 0,
            energy: 0,
            health: 0,
            speed: 0,
            agility: 0,
            strength: 0,
            specialAbilities: false,
            intelligence: 0,
            defense: 0,
            attack: 0,
            availableForBattle: false,
            parent1: dragon1.id,
            parent2: dragon2.id,
        };
        return newEgg;
    }
    return null;
};

/*const hatchEgg = (egg) => {
    const willHatch = Math.random() < eggHatchingProbability;
    const miniDragonImage = selectMiniDragonImage();
    
    if (willHatch) {
        const miniDragon = {
            id: Date.now(),
            name: `Mini Dragon ${Math.floor(Math.random() * 1000)}`,
            type: 'dragon',
            stage: 'mini', 
            imageUrl: `/public/sprites/dragons/${miniDragonImage}`,
            hungry: Math.random() * 100,
            energy: Math.random() * 100,
            health: Math.random() * 100,
            speed: Math.random() * 10,
            agility: Math.random() * 10,
            strength: Math.random() * 10,
            specialAbilities: Math.random() > 0.5,
            intelligence: Math.random() * 10,
            defense: Math.random() * 10,
            attack: Math.random() * 10,
            availableForBattle: false,
        };
        return miniDragon;
    } else {
        return null;
    }
};*/

// Generate a dragon with random characteristics
const generateRandomDragon = (miniDragon) => {
    if (miniDragon.stage === 'mini') {
        return {
            id: Date.now(),
            name: `Dragon ${Math.floor(Math.random() * 1000)}`,
            hungry: Math.random() * 100,
            energy: Math.random() * 100,
            health: Math.random() * 100,
            speed: Math.floor(Math.random() * 100),
            agility: Math.floor(Math.random() * 100),
            strength: Math.floor(Math.random() * 100),
            specialAbilities: Math.random() > 0.5,
            intelligence: Math.floor(Math.random() * 100),
            defense: Math.floor(Math.random() * 100),
            attack: Math.floor(Math.random() * 100),
            availableForBattle: checkAvailableForBattle(miniDragon),
            imageUrl: `/public/sprites/dragons/${selectDragonImage()}`,
            stage: 'adult'
        };
    }
};

const openMysteryBox = () => {
    const randomDragon = {
        id: Date.now(),
        name: `Mysterious Dragon ${Math.floor(Math.random() * 1000)}`,
        type: 'dragon',
        stage: 'adult',
        imageUrl: `/public/sprites/dragons/${selectDragonImage()}`,
        hungry: Math.random() * 100,
        energy: Math.random() * 100,
        health: Math.random() * 100,
        speed: Math.random() * 100,
        agility: Math.random() * 100,
        strength: Math.random() * 100,
        specialAbilities: Math.random() > 0.5,
        intelligence: Math.random() * 100,
        defense: Math.random() * 100,
        attack: Math.random() * 100,
        availableForBattle: checkAvailableForBattle(randomDragon),
    };
    return randomDragon;
};

const decrementDragonAttributes = () => {
    let dragons = getAllDragons();
    dragons.forEach(dragon => {
        // Disminuir hambre y energía con el tiempo
        dragon.hungry = Math.max(dragon.hungry - 1, 0);  // Disminuir hambre, no menos de 0
        dragon.energy = Math.max(dragon.energy - 1, 0);  // Disminuir energía, no menos de 0

        // Actualizar disponibilidad para la batalla
        dragon.availableForBattle = checkAvailableForBattle(dragon);
    });

    // Guardar cambios en el archivo
    saveDragons(dragons);
};

const evolveDragon = (dragonId) => {
    let dragons = getAllDragons();
    const dragon = findDragonById(dragonId);

    // Comprobar si el dragón existe y si está en estado 'egg'
    if (dragon && dragon.stage === 'egg') {
        // Generar un número aleatorio para determinar si el huevo eclosiona
        const willHatch = Math.random() < eggHatchingProbability;

        // Solo eclosiona si la energía y la salud están al 100%
        if (willHatch && dragon.energy === 100 && dragon.health === 100) {
            // Evolucionar a 'mini'
            const evolvedDragon = {
                ...dragon,
                stage: 'mini',
                imageUrl: selectMiniDragonImage(), 
                hungry: 0, 
            };

            dragons = dragons.map(d => (d.id === evolvedDragon.id ? evolvedDragon : d));
            saveDragons(dragons);

            return evolvedDragon;  
        } else if (!willHatch) {
            console.log('El huevo no ha eclosionado.');
        } else {
            console.log('El dragón debe tener energía y salud al 100% para evolucionar.');
        }
        return null; // No se pudo evolucionar
    }

    if (dragon && dragon.stage === 'mini') {
        const allAttributesMet = ['speed', 'strength', 'agility', 'intelligence', 'defense', 'attack'].every(attr => dragon[attr] >= 30);

        if (allAttributesMet) {
            // Evolve to adult
            const evolvedDragon = {
                ...dragon,
                stage: 'adult',
                imageUrl: selectDragonImage(),  // Change the image
                energy: Math.max(dragon.energy - 10, 0),  // Reduce energy
                hungry: Math.max(dragon.hungry - 10, 0),  // Reduce hunger
                health: Math.max(dragon.health - 10, 0),  // Reduce health
                // Cap physical attributes at 30
                speed: Math.min(dragon.speed, 30),
                strength: Math.min(dragon.strength, 30),
                agility: Math.min(dragon.agility, 30),
                intelligence: Math.min(dragon.intelligence, 30),
                defense: Math.min(dragon.defense, 30),
                attack: Math.min(dragon.attack, 30)
            };

            // Update the dragon in the list and save it
            dragons = dragons.map(d => (d.id === evolvedDragon.id ? evolvedDragon : d));
            saveDragons(dragons);

            return evolvedDragon;  // Return the evolved adult dragon
        }
    }

    return null;  // Could not evolve
};


// Dragon model functions
const characterModel = {
    getAllCharacters: getAllDragons,

    findCharacterById: findDragonById,

    saveCharacters: saveDragons, 
    decrementDragonAttributes,
    trainDragon,
    evolveDragon,

    breedDragons: (dragon1Id, dragon2Id) => {
        const dragons = getAllDragons();
        const dragon1 = findDragonById(dragon1Id);
        const dragon2 = findDragonById(dragon2Id);

        if (!dragon1 || !dragon2) return null;

        const newEgg = breedDragons(dragon1, dragon2);
        if (newEgg) {
            dragons.push(newEgg);
            saveDragons(dragons);
        }
        return newEgg;
    },

    hatchEgg: (eggId) => {
        let dragons = getAllDragons();
        const eggIndex = dragons.findIndex(d => d.id === eggId);

        if (eggIndex >= 0 && dragons[eggIndex].stage === 'egg') {
            const newDragon = hatchEgg(dragons[eggIndex]);
            if (newDragon) {
                dragons.splice(eggIndex, 1, newDragon); // Replace egg with mini dragon
                saveDragons(dragons);
                return newDragon;
            } else {
                dragons.splice(eggIndex, 1); // Remove unhatched egg
                saveDragons(dragons);
                return null;
            }
        }
        return null;
    },

    evolveMiniDragon: (dragonId) => {
        let dragons = getAllDragons();
        const dragonIndex = dragons.findIndex(d => d.id === dragonId);

        if (dragonIndex >= 0 && dragons[dragonIndex].stage === 'mini') {
            const evolvedDragon = generateRandomDragon(dragons[dragonIndex]);
            dragons[dragonIndex] = evolvedDragon;
            saveDragons(dragons);
            return evolvedDragon;
        }
        return null;
    },

    regenerateDragonAttributes: (dragonId, action) => {
        let dragons = getAllDragons();
        const dragon = findDragonById(dragonId);

        if (dragon) {
            const updatedDragon = regenerateAttributes(dragon, action);
            saveDragon(updatedDragon);
            return updatedDragon;
        }
        return null;
    },

    openMysteryBox: () => {
        const dragons = getAllDragons();
        const newDragon = openMysteryBox();
        dragons.push(newDragon);
        saveDragons(dragons);
        return newDragon;
    },

    deleteDragon: (id) => {
        let dragons = getAllDragons();
        dragons = dragons.filter(dragon => dragon.id !== id);
        saveDragons(dragons);
    }
};



module.exports = characterModel;
