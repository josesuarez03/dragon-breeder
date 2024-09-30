const characterModel = require('../models/characterModel');

exports.index = (req, res) => {
    const characters = characterModel.getAllCharacters();
    res.render('characters/characters', { characters });
};

exports.create = (req, res) => {
    res.render('characters/create');
};

exports.store = (req, res) => {
    const characters = characterModel.getAllCharacters();

    // Crear un nuevo personaje con los atributos enviados en la solicitud
    const newCharacter = {
        id: characters.length + 1, // Asignar ID basado en la longitud actual
        name: req.body.name,       // Nombre del dragón
        hungry: parseFloat(req.body.hungry),    // Nivel de hambre
        energy: parseFloat(req.body.energy),    // Nivel de energía
        health: parseFloat(req.body.health),    // Nivel de salud
        speed: parseFloat(req.body.speed),      // Velocidad
        agility: parseFloat(req.body.agility),  // Agilidad
        strength: parseFloat(req.body.strength),// Fuerza
        specialAbilities: req.body.specialAbilities === 'true', // Habilidades especiales
        intelligence: parseFloat(req.body.intelligence), // Inteligencia
        defense: parseFloat(req.body.defense), // Defensa
        attack: parseFloat(req.body.attack),   // Ataque
        stage: req.body.stage, // mini o adulto
        imageUrl: req.body.imageUrl, // URL de la imagen
        availableForBattle: false
     };

    const dragons = characterModel.getAllCharacters();
    dragons.push(newCharacter);
    characterModel.saveCharacters(dragons);

    res.redirect('/characters')
};

exports.edit = (req, res) => {
    const character = characterModel.findDragonById(parseInt(req.params.id));
    res.render('characters/edit', { character });
};

exports.update = (req, res) => {
    let characters = characterModel.getAllCharacters();
    const characterIndex = characters.findIndex(c => c.id === parseInt(req.params.id));
    if (characterIndex >= 0) {
        characters[characterIndex] = { ...characters[characterIndex], ...req.body };
        characterModel.saveCharacters(characters);
    }
    res.redirect('/characters');
};

exports.delete = (req, res) => {
    let characters = characterModel.getAllCharacters();
    characters = characters.filter(c => c.id !== parseInt(req.params.id));
    characterModel.saveCharacters(characters);
    res.redirect('/characters');
};