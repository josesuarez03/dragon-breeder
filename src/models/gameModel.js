const fs = require('fs');
const {GameState} = require('./dbModel')

const { v4: uuidv4 } = require('uuid');

const initGameStateCollection = async () => {
  try {
    await GameState.createCollection();
    console.log('GameState collection created or verified');
  } catch (error) {
    console.error('Error creating GameState collection:', error);
    throw error;
  }
};

// Función para obtener el estado del juego
const getGameState = async () => {
  try {
      await initGameStateCollection();
      const gameState = await GameState.findOne().maxTimeMS(20000).exec();
      if (!gameState) {
          const uuid = uuidv4();
          const defaultState = new GameState({ uuid, characterId: null });
          await defaultState.save();
          return defaultState;
      }
      return gameState;
  } catch (error) {
      console.error("Error al leer el estado del juego:", error);
      if (error.name === 'MongoTimeoutError') {
          console.error('La operación agotó el tiempo de espera. Esto puede deberse a una alta carga o problemas de red.');
      }
      throw error;
  }
};

const createGameState = async (userId) => {
  try {
      const newGameState = new GameState({ userId });
      await newGameState.save();
      return newGameState;
  } catch (error) {
      console.error("Error al crear el estado del juego:", error);
      throw error;
  }
};

const saveGameState = async (state) => {
  try {
      await GameState.findOneAndUpdate({ uuid: state.uuid }, state, { 
          upsert: true, 
          maxTimeMS: 20000 
      });
  } catch (error) {
      console.error("Error al guardar el estado del juego:", error);
      throw error;
  }
};

const updateGameState = async (userId, updateData) => {
  try {
    const updatedState = await GameState.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, maxTimeMS: 20000 }
    );
    return updatedState;
  } catch (error) {
    console.error("Error al actualizar el estado del juego:", error);
    throw error;
  }
};

module.exports = { getGameState, saveGameState, initGameStateCollection, createGameState, updateGameState };
