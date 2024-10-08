const {User} = require('./dbModel');

// Obtener todos los usuarios
const getAllUsers = async () => {
    return await User.find();
};

// Guardar varios usuarios
const saveUsers = async (users) => {
    await User.insertMany(users);
};

// Buscar un usuario por su ID
const findUserById = async (id) => {
    return await User.findOne({ _id: id });  // Se utiliza _id ya que Mongo usa este campo por defecto para las IDs
};

// Guardar o actualizar un usuario
const saveUser = async (updatedUser) => {
    await User.findOneAndUpdate({ _id: updatedUser._id }, updatedUser, { upsert: true });
};

// Exportar las funciones
module.exports = {
    getAllUsers,
    saveUsers,
    findUserById,
    saveUser
};
