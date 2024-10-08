const fs = require('fs');
const path = require('path');

const {Dragon} = require('./dbModel')

//const dragonSpritesPath = path.join(__dirname, '../public/sprites/dragons');
//const eggSpritesPath = path.join(__dirname, '../public/sprites/eggs');

const eggHatchingProbability = 0.8;

const getAllDragons = async() => {
    return await Dragon.find();
};

const saveDragons = async (dragons) => {
    await Dragon.insertMany(dragons);
};

const findDragonById = async (id) => {
    return await Dragon.findOne({ _id: id });
};

const saveDragon = async (updatedDragon) => {
    await Dragon.findOneAndUpdate({ id: updatedDragon.id }, updatedDragon, { upsert: true });
};


const selectDragonImage = async () => {
    const dragonImages = await fs.promises.readdir(dragonSpritesPath);
    const availableDragon = dragonImages[Math.floor(Math.random() * dragonImages.length)];
    return availableDragon;
};

const selectEggImage = async (type) => {
    const eggImages = await fs.promises.readdir(eggSpritesPath);  // Versión asíncrona
    const availableEggs = eggImages.filter(image => image.includes(type));
    return availableEggs[Math.floor(Math.random() * availableEggs.length)];
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
const trainDragon = async (dragon) => {
    const attributes = ['speed', 'strength', 'agility', 'intelligence', 'defense', 'attack'];

    attributes.forEach(attribute => {
        dragon[attribute] += 1; // Incrementar cada atributo en 1
    });

    await saveDragon(dragon); // Asegúrate de guardar el dragón después de entrenarlo
};


const breedDragons = async (dragon1Id, dragon2Id) => {
    const dragon1 = await findDragonById(dragon1Id);  // Buscar los dragones por ID
    const dragon2 = await findDragonById(dragon2Id);

    if (dragon1.type === 'chicken' || dragon2.type === 'chicken' || dragon1.type === dragon2.type) {
        const eggImage = await selectEggImage(dragon1.type === 'chicken' || dragon2.type === 'chicken' ? 'chicken' : 'dragon');
        
        const newEgg = new Dragon({
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
            parent1: dragon1._id,
            parent2: dragon2._id,
        });
        
        await newEgg.save();  // Guardar el nuevo huevo en la base de datos
        return newEgg;
    }
    return null;
};


const openMysteryBox = async () => {
    const randomDragon = new Dragon({
        id: Date.now(), // O considera usar _id
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
    });
    await randomDragon.save();
    return randomDragon;
};

const decrementDragonAttributes = async () => {
    let dragons = await getAllDragons();
    dragons.forEach(dragon => {
        // Disminuir hambre y energía con el tiempo
        dragon.hungry = Math.max(dragon.hungry - 1, 0);  // Disminuir hambre, no menos de 0
        dragon.energy = Math.max(dragon.energy - 1, 0);  // Disminuir energía, no menos de 0

        // Actualizar disponibilidad para la batalla
        dragon.availableForBattle = checkAvailableForBattle(dragon);
    });

    // Guardar cambios en el archivo
    await saveDragons(dragons);
};

const evolveDragon = async (dragonId) => {
    const dragon = await findDragonById(dragonId);

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
                imageUrl: `/public/sprites/dragons/${await selectDragonImage()}`, 
                hungry: 0, 
            };

            await Dragon.findOneAndUpdate({ id: dragonId }, evolvedDragon, { upsert: true });

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
                imageUrl: `/public/sprites/dragons/${await selectDragonImage()}`,
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

            await Dragon.findOneAndUpdate({ id: dragonId }, evolvedDragon, { upsert: true });

            return evolvedDragon;  // Return the evolved adult dragon
        }
    }

    return null;  // Could not evolve
};

// Generate a dragon with random characteristics
const generateRandomDragon = (adultDragon) => {
    if (adultDragon.stage === 'adult') {
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
            availableForBattle: checkAvailableForBattle(adultDragon),
            imageUrl: `/public/sprites/dragons/${selectDragonImage()}`,
            stage: 'adult'
        };
    }
  };


// Dragon model functions
const characterModel = {
    getAllCharacters: getAllDragons,

    findCharacterById: findDragonById,

    saveCharacters: saveDragons, 
    decrementDragonAttributes,
    trainDragon,
    evolveDragon,

    breedDragons,


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

    evolveMiniDragon: async (dragonId) => {
        let dragons = await getAllDragons();
        const dragonIndex = dragons.findIndex(d => d.id === dragonId);

        if (dragonIndex >= 0 && dragons[dragonIndex].stage === 'mini') {
            const evolvedDragon = generateRandomDragon(dragons[dragonIndex]);
            dragons[dragonIndex] = evolvedDragon;
            await saveDragons(dragons);
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
