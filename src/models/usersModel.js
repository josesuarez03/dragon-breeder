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
// Función para encontrar un usuario por nombre de usuario
const findUserByUsername = async (username) => {
    try {
        return await User.findOne({ username });
    } catch (error) {
        console.error('Error al buscar usuario por nombre de usuario:', error);
        throw error;
    }
};

// Función para actualizar un usuario
const updateUser = async (userId, updateData) => {
    try {
        return await User.findByIdAndUpdate(userId, updateData, { new: true });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
};

// Función para obtener un usuario por nombre de usuario
const getUserByUsername = async (username) => {
    try {
        return await User.findOne({ username });
    } catch (error) {
        console.error('Error al buscar usuario por nombre de usuario:', error);
        throw error;
    }
};

// Función para obtener un usuario por correo electrónico
const getUserByEmail = async (email) => {
    try {
        return await User.findOne({ email });
    } catch (error) {
        console.error('Error al buscar usuario por correo electrónico:', error);
        throw error;
    }
};

// Actualiza las posiciones de todos los usuarios sin posición inicial
const initializeUserPositions = async () => {
    try {
        const result = await User.updateMany(
            { "position.x": { $exists: false } },
            {
                $set: {
                    "position.x": 400,
                    "position.y": 400,
                    "position.lastUpdate": new Date()
                }
            }
        );
        return result.nModified; // Retorna la cantidad de usuarios actualizados
    } catch (error) {
        console.error("Error al actualizar posiciones de usuarios:", error);
        throw error;
    }
};

const initMissingField = async () => {
    try {
        // Encuentra todos los usuarios sin el campo 'activeCharacterId'
        const usersWithoutField = await User.find({ activeCharacterId: { $exists: false } });

        // Actualizar cada usuario sin el campo
        for (let user of usersWithoutField) {
            await user.updateMissingField();
        }

        console.log(`Campo 'activeCharacterId' actualizado en ${usersWithoutField.length} usuarios.`);
    } catch (error) {
        console.error(`Error al actualizar el campo 'activeCharacterId' de usuarios:`, error);
        throw error;
    }
};

// Obtener lista de usuarios en línea y sus posiciones
const getOnlineUsersWithPositions = async () => {
    try {
        return await User.find(
            { isOnline: true },
            'userId username email dragons position'
        );
    } catch (error) {
        console.error("Error al obtener usuarios en línea con posiciones:", error);
        throw error;
    }
};


// Exportar las funciones
module.exports = {
    getAllUsers,
    createUser,
    saveUser,
    findUserById,
    deleteUser,
    getOnlineUsers,
    initUserCollection,
    findUserByUsername,  // Nueva exportación
    updateUser,          // Nueva exportación
    getUserByEmail,
    getUserByUsername,
    initializeUserPositions,
    getOnlineUsersWithPositions,
    initMissingField
};
