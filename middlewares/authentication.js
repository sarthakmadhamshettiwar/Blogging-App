// middleware to attach user object to the req if valid token is found
const {validateToken} = require('../services/authentication');


function checkForAuthCookie(cookieName){
    return (req, res, next)=>{
        const tokenCookieValue = req.cookies[cookieName];
        if(!tokenCookieValue){
            return next();
        }

        //token is present, hence check whether it is valid or not
        try{
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
        }
        catch(err){
            console.log(err);
        }
        return next();
    };
};

module.exports = {checkForAuthCookie}