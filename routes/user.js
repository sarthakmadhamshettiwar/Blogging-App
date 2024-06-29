const express = require("express");
const {model} = require("mongoose");
const User = require('../models/user');

const router = express.Router();

router.get('/signin', (req, res)=>{
    if(req.user){
        return res.redirect('/', {user: req.user});
    }
    else{
        return res.render("signin");
    }
})
router.get('/signup', (req, res)=>{
    return res.render("signup");
})
router.get('/logout', (req, res)=>{
    res.clearCookie('token');
    res.redirect('/');
})

router.post('/signin', async (req, res)=>{
    const {email, password} = req.body;
    //const token = await User.matchPasswordAndGenerateToken(email, password);    //the matchPasswordAndGenerateToken will pop an error which will crash the app
    try{
        const token = await User.matchPasswordAndGenerateToken(email, password); 
        res.cookie('token', token); //storing the token in cookie itself
        return res.redirect('/');   
    }
    catch(err){
        //console.log(err);
        res.render('signin', {error: 'Incorrect email or password'})
    }
    //console.log('User', user);
    
    //res.redirect('/');
})
router.post('/signup', async(req, res)=>{
    const {fullName, email, password} = req.body;
    User.create({
        fullName,
        email,
        password
    });
    return res.redirect("/");
})

module.exports = router;