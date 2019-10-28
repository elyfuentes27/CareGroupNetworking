const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    // Get Token from header from x-auth-token
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({
            msg: 'No Token, authorization denied'
        });
    }

    //verify token 
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret')); //decoded with jwt verify

        req.user = decoded.user; //set req user to decoded user... to get user profile
        next();
    } catch (err) { // if token not valid
        res.status(401).json({
            msg: 'Token is not Valid'
        });
    }
}