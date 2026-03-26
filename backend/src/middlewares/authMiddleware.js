const jwt = require("jsonwebtoken");
const { getUserById } = require("../models/user");

/**
 * Auth Middleware
 *
 * 1. HTTP-only cookie: "accessToken" -> set by authController on login
 * 2. Authorization header: "Bearer <token>" -> for API (Postman)
 *
 * On success, attaches req.user = { id, email, name } and calls next().
 * On failure, returns 401.
 */

const authMiddleware = async (req, res, next) => {
    let token;

    try{
        if (req.cookies?.accessToken)
            token = req.cookies?.accessToken;
        else if (req.headers.authorization?.startsWith('Bearer '))
            token = req.headers.authorization.split(' ')[1];

        if (!token)
            return res.status(401).json({
                message : "Not authenticated. Please log in to continue."
            })

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await getUserById(decoded.id);
        if (!user)
            return res.status(401).json({
                message: "User no longer exists"
            })

        req.user = {id: user.id, name: user.name, email: user.email};
        next();
    } 

    catch(err){
        if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            message: 'Session expired. Please log in again.' 
        });
        }
        if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            message: 'Invalid token.'
        });
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ 
            message: 'Internal server error.' 
        });
    }
}

module.exports = authMiddleware;