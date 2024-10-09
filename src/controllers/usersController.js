const { User } = require('../models/dbModel');
const usersModel = require('../models/usersModel');

exports.register = async (req, res) => {
    const { username, password, email } = req.body;

    try{
        const newUser = new User({ username, password, email });
        await usersModel.saveUser();

        res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
    }catch{
        res.status(500).json({ message: 'Error al registrar el usuario', error });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Buscar usuario por su nombre de usuario
        const user = await usersModel.findUserByUsername(username);
        const passwordHash = await user.comparePassword(password);

        if (!user || user.password !== passwordHash) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Actualizar el estado isOnline a true cuando el usuario inicia sesión
        await usersModel.updateUser(user._id, { isOnline: true });

        if (user.role === true) {
            return res.status(200).json({ message: 'Inicio de sesión exitoso como administrador', user });
        } else {
            return res.status(200).json({ message: 'Inicio de sesión exitoso', user });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};

exports.logout = async (req, res) => {
    const { username } = req.body;  // O puedes usar el `id` del usuario almacenado en la sesión

    try {
        const user = await usersModel.findUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar el estado isOnline a false cuando el usuario cierra sesión
        await usersModel.updateUser(user._id, { isOnline: false });

        return res.status(200).json({ message: 'Cierre de sesión exitoso', user });

    } catch (error) {
        res.status(500).json({ message: 'Error al cerrar sesión', error });
    }
};

exports.onlineUsers = async (req, res) => {
    try {
        // Filtrar usuarios que están en línea
        const onlineUsers = await usersModel.getOnlineUsers();
        res.status(200).json(onlineUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios en línea', error });
    }
};

exports.edit = async (req, res) => {
    const { id } = req.params;
    const { username, password, email } = req.body;

    try {
        const updatedUser = await usersModel.updateUser(id, { username, password, email });
        res.status(200).json({ message: 'Usuario actualizado exitosamente', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario', error });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    const { role, userId } = req.user; // Asumimos que estos datos vienen del middleware de autenticación

    try {
        if (role === true) {
            // Si es admin (role es true), puede eliminar cualquier usuario
            const deletedUser = await usersModel.deleteUser(id);
            if (!deletedUser) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            return res.status(200).json({ message: 'Usuario eliminado exitosamente', user: deletedUser });
        } else {
            // Si es usuario normal (role es false), solo puede eliminar su propia cuenta
            if (id !== userId) {
                return res.status(403).json({ message: 'No tienes permiso para eliminar esta cuenta' });
            }
            const deletedUser = await usersModel.deleteUser(id);
            if (!deletedUser) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            return res.status(200).json({ message: 'Tu cuenta ha sido eliminada exitosamente', user: deletedUser });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario', error });
    }
};

exports.allUser = async (req, res) => {
    try {
        const onlineUsers = await usersModel.getOnlineUsers();
        res.status(200).json(onlineUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios en línea', error });
    }
};