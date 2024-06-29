const JWT = require('jsonwebtoken');
const secret = '123@SPM';
function createTokenForUser(user){
    let payload = {
        _id: user._id,
        email: user.email,
        profileImageURL: user.profileImageURL,
        role: user.role,
    };

    const token = JWT.sign(payload, secret);
    return token;
}

function validateToken(token){
    let payload = JWT.verify(token, secret);
    return payload;
}

module.exports = {
    createTokenForUser, 
    validateToken
}