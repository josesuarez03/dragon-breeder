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
    const character = characterModel.findCharacterById(parseInt(req.params.id));
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
exports.battle = (req, res) => {
  const playerDragon = characterModel.findCharacterById(parseInt(req.params.id));
 machineDragon = {
      id: Date.now(), // Asignar ID basado en la fecha actual
      name: `Dragon ${Math.floor(Math.random() * 1000)}`, // Nombre del dragón
      hungry: Math.random() * 100, // Nivel de hambre
      energy: Math.random() * 100, // Nivel de energía
      health: Math.random() * 100, // Nivel de salud
      speed: Math.floor(Math.random() * 100), // Velocidad
      agility: Math.floor(Math.random() * 100), // Agilidad
      strength: Math.floor(Math.random() * 100), // Fuerza
      specialAbilities: Math.random() > 0.5, // Habilidades especiales
      intelligence: Math.floor(Math.random() * 100), // Inteligencia
      defense: Math.floor(Math.random() * 100), // Defensa
      attack: Math.floor(Math.random() * 100), // Ataque
      stage: 'adulto', // mini o adulto
      imageUrl: `/public/sprites/dragons/${selectDragonImage()}`, // URL de la imagen
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
};
  
  // Agrega un nuevo controlador para el ataque especial
  exports.specialAttack = (req, res) => {
    // Obtiene los dragones y sus vidas actuales
    const playerDragon = characterModel.findCharacterById(parseInt(req.params.id));
    const machineDragon = characterModel.getAllCharacters()[Math.floor(Math.random() * characterModel.getAllCharacters().length)];
    let playerLife = req.body.playerLife;
    let machineLife = req.body.machineLife;
  
    // Verifica si el ataque especial tiene éxito
    const success = Math.random() > 0.4;
  
    // Verifica si el jugador tiene más agilidad y velocidad que la máquina
    if (playerDragon.agility > machineDragon.agility && playerDragon.speed > machineDragon.speed) {
      if (success) {
        machineLife -= 25;
      } else {
        playerLife -= 10;
      }
    } else {
      playerLife -= 10;
    }
  
    // Renderiza la vista de la arena de combate con los nuevos valores de vida
    res.render('characters/battle', {
      playerDragon,
      machineDragon,
      playerLife,
      machineLife
    });
  };
  
  // Agrega un nuevo controlador para el ataque normal
  exports.normalAttack = (req, res) => {
    // Obtiene los dragones y sus vidas actuales
    const playerDragon = characterModel.findCharacterById(parseInt(req.params.id));
    const machineDragon = characterModel.getAllCharacters()[Math.floor(Math.random() * characterModel.getAllCharacters().length)];
    let playerLife = req.body.playerLife;
    let machineLife = req.body.machineLife;
  
    // Verifica si el ataque normal tiene éxito
    const success = Math.random() > 0.25;
  
    // Verifica si el rival es más fuerte que la máquina
    if (playerDragon.strength > machineDragon.strength) {
      if (success) {
        machineLife -= 10;
      } else {
        playerLife -= 10;
      }
    } else {
      playerLife -= 10;
    }
  
    // Renderiza la vista de la arena de combate con los nuevos valores de vida
    res.render('characters/battle', {
      playerDragon,
      machineDragon,
      playerLife,
      machineLife
    });
  };
