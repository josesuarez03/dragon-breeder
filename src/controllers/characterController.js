const characterModel = require('../models/characterModel');

exports.index = async (req, res) => {
    try {
        const characters = await characterModel.getAllCharacters(); // Asegúrate de usar await
        res.render('characters/characters', { characters });
    } catch (error) {
        res.status(500).send('Error al obtener los personajes');
    }
};

exports.create = (req, res) => {
    res.render('characters/create');
};

exports.store = async (req, res) => {
    try {
        const newCharacter = {
            name: req.body.name,
            hungry: parseFloat(req.body.hungry),
            energy: parseFloat(req.body.energy),
            health: parseFloat(req.body.health),
            speed: parseFloat(req.body.speed),
            agility: parseFloat(req.body.agility),
            strength: parseFloat(req.body.strength),
            specialAbilities: req.body.specialAbilities === 'true',
            intelligence: parseFloat(req.body.intelligence),
            defense: parseFloat(req.body.defense),
            attack: parseFloat(req.body.attack),
            stage: req.body.stage,
            imageUrl: req.body.imageUrl,
            availableForBattle: false
        };

        await characterModel.saveDragon(newCharacter); // Guardar usando el modelo

        res.redirect('/characters');
    } catch (error) {
        res.status(500).send('Error al crear el personaje');
    }
};

exports.edit = async (req, res) => {
    try {
        const character = await characterModel.findCharacterById(req.params.id); // Usar await y convertir id
        res.render('characters/edit', { character });
    } catch (error) {
        res.status(500).send('Error al editar el personaje');
    }
};

exports.update = async (req, res) => {
    try {
        const updatedCharacter = {
            ...req.body,
            id: req.params.id
        };

        await characterModel.saveDragon(updatedCharacter); // Guardar usando MongoDB

        res.redirect('/characters');
    } catch (error) {
        res.status(500).send('Error al actualizar el personaje');
    }
};

exports.delete = async (req, res) => {
    try {
        await characterModel.deleteDragon(req.params.id); // Implementar esta función en characterModel
        res.redirect('/characters');
    } catch (error) {
        res.status(500).send('Error al eliminar el personaje');
    }
};

exports.battle = async (req, res) => {
    try {
        const playerDragon = await characterModel.findCharacterById(req.params.id);
        const machineDragon = {
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
            stage: 'adulto',
            imageUrl: `/public/sprites/dragons/${await characterModel.selectDragonImage()}`, // Asegúrate de que selectDragonImage sea asíncrono
            availableForBattle: true
        };

        let playerLife = 100;
        let machineLife = 100;

        res.render('characters/battle', {
            playerDragon,
            machineDragon,
            playerLife,
            machineLife
        });
    } catch (error) {
        res.status(500).send('Error al iniciar la batalla');
    }
};

// Los controladores de ataques especiales y normales también deben manejar `async/await`
