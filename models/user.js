const {Schema, model} = require("mongoose");
const {createHmac, randomBytes} = require("node:crypto");
const { userRoute } = require("../routes/user");
const {createTokenForUser, validateToken} = require("../services/authentication")
const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        require: true,
        unique: true,
    },
    salt: {
        type: String,
        //required: true,
    },
    password: {
        type: String,
        required: true,

    },
    profileImageURL: {
        type: String,
        default: "/images/default.png"
    }, 
    role: {
        type:String,
        enum: ['USER', 'ADMIN'],
        default: "USER",
    },
})

//do this before saving user into schema
userSchema.pre('save', function(next){
    const user = this;
    if(!user.isModified("password"))    return;

    //hashing the password
    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac('sha256', salt)
    .update(user.password)
    .digest("hex");
     
    this.salt = salt;
    this.password = hashedPassword;

    console.log(`${this.fullName} signed up`);
    next();
})

userSchema.static('matchPasswordAndGenerateToken', async function (email, password){
    //this keyword doesn't work in => functions
    const user = await this.findOne({email});
    if(!user){
        //No user exists
        //return false;
        throw new Error('No such user exist');
    }

    let userProvidedHash = createHmac('sha256', user.salt)
    .update(password)
    .digest("hex");
    if(userProvidedHash === user.password){
        const token = createTokenForUser(user);
        return token;
    }
    else{
        throw new Error('Incorrect password');
    }
})
const User = model('user', userSchema);

module.exports = User;