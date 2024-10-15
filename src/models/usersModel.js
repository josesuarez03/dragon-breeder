const { User } = require('./dbModel');

// Inicializar la colección de usuarios
const initUserCollection = async () => {
    try {
        await User.createCollection();
        console.log('User collection created or verified');
    } catch (error) {
        console.error('Error creating User collection:', error);
        throw error;
    }
};

// Obtener todos los usuarios
const getAllUsers = async () => {
    try {
        await initUserCollection();
        const users = await User.find().maxTimeMS(30000).exec();
        if (users.length === 0) {
            console.log("No se encontraron usuarios en la base de datos.");
        }
        return users;
    } catch (error) {
        console.error("Error al obtener los usuarios:", error);
        throw error;
    }
};

// Crear un nuevo usuario
const createUser = async (userData) => {
    try {
        const newUser = new User(userData);
        await newUser.save();  // Guarda el usuario
        return newUser;
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        throw error;
    }
};

// Actualizar o guardar usuario (actualización por ID)
const saveUser = async (updatedUser) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: updatedUser._id },
            updatedUser,
            { new: true, upsert: true } // `new` devuelve el documento actualizado; `upsert` lo crea si no existe
        );
        return user;
    } catch (error) {
        console.error("Error al guardar el usuario:", error);
        throw error;
    }
};

// Eliminar un usuario por su ID
const deleteUser = async (id) => {
    try {
        return await User.findByIdAndDelete(id);
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        throw error;
    }
};

// Obtener usuarios en línea
const getOnlineUsers = async () => {
    try {
        return await User.find({ isOnline: true });
    } catch (error) {
        console.error('Error al obtener usuarios en línea:', error);
        throw error;
    }
};

// Buscar un usuario por ID
const findUserById = async (id) => {
    try {
        return await User.findById(id);
    } catch (error) {
        console.error('Error al buscar el usuario por ID:', error);
        throw error;
    }
};

// Exportar las funciones
module.exports = {
    getAllUsers,
    createUser,       // Renombrado para más claridad
    saveUser,
    findUserById,
    deleteUser,
    getOnlineUsers,
    initUserCollection,
};
