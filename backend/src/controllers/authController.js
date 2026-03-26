const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4:uuidv4 } = require('uuid');
const { createUser, getUserById, getUserByEmail, updateUser } = require('../models/user');

const signToken = (userId) => {
    return jwt.sign({ id: userId }, 
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.EXPIRES_IN || '1d'
        });
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
};

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password){
            return res.status(400).json({ 
                message: 'Name, Email and Password are required.' 
            });
        }

        const existing = await getUserByEmail(email);
        if (existing){
            return res.status(409).json({
                message: 'An account with this email already exists.' 
            });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const userId = uuidv4();
 
        const user = await createUser(userId, {
            name,
            email: email.toLowerCase().trim(),
            passwordHash,
            createdAt: new Date(),
        });

        const token = signToken(userId);
        return res.status(200)
            .cookie('accessToken', token, cookieOptions)
            .json({
                message: "Registration successful",
                token,
                user: { id: user.id, name: user.name, email: user.email }
        });  
    }
    catch (err){
        console.error('Register error:', err);
        return res.status(500).json({ 
            message: 'Server error during registration.'
        });
    }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        
        const user = await getUserByEmail(email);
        if (!user){
            return res.status(400).json({
                message: "Invalid user email (Doesn't exist)."
            });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch){
            return res.status(401).json({
                message: "Invalid password. Try again"
            });
        }

        const token = signToken(user.id);
        return res.status(200)
            .cookie('accessToken', token, cookieOptions)
            .json({
                message: "Login successful",
                token,
                user : {id : user.id, name: user.name, email: user.email}
        });
    }
    catch (err){
        console.error('Login error:', err);
        return res.status(500).json({
            message: "Server error during login"
        });
    }
}

/**
 * POST /api/auth/logout
 * Clears the HttpOnly cookie.
 */
const logout = async (req, res) => {
    return res.status(200)
        .clearCookie('accessToken', cookieOptions)
        .json({
            message: "Logged out successfully"
        });
}

/**
 * PATCH /api/auth/reset-password
 * Protected – user must be logged in
 * Body: { currentPassword, newPassword }
 */
const resetPassword = async (req, res) => {
    const {currentPassword, newPassword} = req.body;

    const user = await getUserById(req.user.id);
    if (!user){
        return res.status(404).json({
            message: "User not found"
        });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch){
        return res.status(401).json({
            message: "Invalid password"
        });
    }

    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, genSalt);

    await updateUser(user.id, {passwordHash: hashedPassword});

    const token = signToken(user.id);
    return res.status(200)
        .cookie('accessToken', token, cookieOptions)
        .json({
            message: "Password updated successfully"
    });
}

/**
 * GET /api/auth/me
 * Protected – returns the currently authenticated user.
 */
const getMe = async (req, res) => {
    try{
        const user = await getUserById(req.user.id);
        if (!user){
            return res.status(404).json({
                message: "User not found"
            })
        }

        const {passwordHash, ...safeUser} = user;
        return res.status(200).json({
            message: "User found",
            user: safeUser
        });
    }
    catch (err) {
        console.error('getMe error: ', err);
        return res.status(500).json({
            message: "Server error during getMe"
        });
    }
}

module.exports = {register, login, logout, resetPassword, getMe}