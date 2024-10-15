const { createUser, findUserByUsername, updateUser } = require('../models/usersModel');
const {User} = require('../models/dbModel');

// Método para mostrar y procesar el registro de usuarios
exports.register = async (req, res) => {
    if (req.method === 'GET') {
        return res.render('register');  // Renderiza la vista de registro si es una solicitud GET
    }

    const { username, password, email } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Faltan campos requeridos: username, email, o password' });
    }

    try {
        // Verificar si el nombre de usuario ya existe
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        // Verificar si el correo electrónico ya existe
        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
        }

        const newUser = await createUser({ username, password, email });
        res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ message: 'Error al registrar el usuario', error });
    }
};

// Método para mostrar y procesar el login de usuarios
exports.login = async (req, res) => {
    if (req.method === 'GET') {
        return res.render('login');  // Renderiza la vista de login si es una solicitud GET
    }

    const { username, password } = req.body;

    console.log(req.body);

    try {
        // Buscar el usuario por nombre de usuario
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Comparar la contraseña ingresada con la almacenada
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Si el login es exitoso, actualizamos el estado `isOnline` del usuario
        await updateUser(user._id, { isOnline: true });

        // Verificar el rol del usuario
        const userRole = user.role ? 'true' : 'false';


        // Aquí puedes agregar lógica adicional basada en el rol si es necesario
        if (userRole === 'true') {
            responseData.adminMessage = 'Bienvenido, administrador';
            // Podrías agregar más datos o permisos específicos para administradores
        }
        

        return res.status(200).json({ message: 'Inicio de sesión exitoso', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};
exports.logout = async (req, res) => {
    const { username } = req.body;  // O puedes usar el `id` del usuario almacenado en la sesión

    try {
        const user = await findUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar el estado online del usuario
        await updateUser(user._id, { isOnline: false });

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