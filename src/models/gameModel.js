const fs = require('fs');
const {GameState} = require('./dbModel')

// Función para obtener el estado del juego
const getGameState = async () => {
    try {
      const gameState = await GameState.findOne();
      if (!gameState) {
        const uuid = uuidv4();
        const defaultState = new GameState({ uuid, characterId: null });
        await defaultState.save();
        return defaultState;
      }
      return gameState;
    } catch (error) {
      console.error("Error al leer el estado del juego:", error);
      const uuid = uuidv4();
      const defaultState = new GameState({ uuid, characterId: null });
      await defaultState.save();
      return defaultState;
    }
};
  
// Función para guardar el estado del juego
const saveGameState = async (state) => {
    try {
      await GameState.findOneAndUpdate({ uuid: state.uuid }, state, { upsert: true });
    } catch (error) {
      console.error("Error al guardar el estado del juego:", error);
    }
};

module.exports = { getGameState, saveGameState };
