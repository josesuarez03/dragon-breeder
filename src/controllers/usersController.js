const { createUser, findUserByUsername, updateUser, getUserByEmail, getUserByUsername } = require('../models/usersModel');
const {User} = require('../models/dbModel');

// Método para mostrar y procesar el registro de usuarios
exports.register = async (req, res) => {
    if (req.method === 'GET') {
        return res.render('register', {layout: false});  // Renderiza la vista de registro si es una solicitud GET
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
        
        console.log('Usuario registrado exitosamente:', newUser.username);
        
        // Iniciar sesión automáticamente después del registro
        req.session.userId = newUser._id;
        req.session.userRole = newUser.role;
        
        return res.redirect('/game');
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ message: 'Error al registrar el usuario', error });
    }
};

exports.login = async (req, res) => {
    if (req.method === 'GET') {
        return res.render('login', {layout: false});
    }

    const { username, password } = req.body;

    try {
        const user = await findUserByUsername(username);

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Actualizar el estado online del usuario
        await updateUser(user._id, { isOnline: true });

        // Limpiar y configurar la sesión del usuario
        req.session.regenerate(async (err) => {
            if (err) {
                console.error('Error regenerando la sesión:', err);
                return res.status(500).json({ message: 'Error al iniciar sesión' });
            }

            req.session.userId = user._id;
            req.session.userRole = user.role;
            req.session.isAdmin = user.role === true;

            // Reiniciar cualquier dato de dragones en la sesión
            req.session.userDragons = []; // Para asegurarse de que los dragones de otro usuario no se filtren

            // Redirigir según el rol
            if (user.role === true) {
                res.redirect('/admin/dashboard');
            } else {
                res.redirect('/game');
            }
        });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};


exports.logout = async (req, res) => {
    try {
        if (req.session) {
            const userId = req.session.userId;

            // Limpiar variables de sesión específicas antes de destruir la sesión
            req.session.userId = null;
            req.session.userRole = null;
            req.session.isAdmin = null;
            req.session.userDragons = null;

            req.session.destroy(async (err) => {
                if (err) {
                    console.error('Error al destruir la sesión:', err);
                    return res.status(500).json({ message: 'Error al cerrar sesión', error: err });
                }

                res.clearCookie('connect.sid');

                if (userId) {
                    try {
                        await updateUser(userId, { isOnline: false });
                    } catch (updateError) {
                        console.error('Error al actualizar el estado online del usuario:', updateError);
                    }
                }

                res.redirect('/');
            });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error en el proceso de cierre de sesión:', error);
        res.status(500).json({ message: 'Error al cerrar sesión', error });
    }
};


// Método para mostrar los usuarios online
exports.onlineUsers = async (req, res) => {
    try {
        const onlineUsers = await User.find({ isOnline: true });
        res.render('users/onlineUsers', { users: onlineUsers });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los usuarios en línea', error });
    }
};

// Método para mostrar el dashboard de administración
exports.dashboardAdmin = async (req, res) => {
    try {
        const users = await usersModel.getAllUsers();
        res.render('users/dashboardAdmin', { users });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la lista de usuarios', error });
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