const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const personalRoute = require('./routes/personal');

const Blog = require('./models/blog');

const {checkForAuthCookie} = require('./middlewares/authentication');
const app  = express();
const PORT = 8000;


mongoose
.connect("mongodb://127.0.0.1:27017/blogium")
.then((e)=>{
    console.log('MongoDB connected');
});

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: false }));   //for parsing form data

//middleware layer
app.use(cookieParser());
app.use(checkForAuthCookie('token'));   //cookie attached with req object with the name of 'token' will be processed by the middleware
app.use(express.static(path.resolve('./public')));

app.use('/user', userRoute);
app.use('/blog', blogRoute);
app.use('/personal', personalRoute);

app.get('/', async (req, res)=>{
    //Get all the blogs on the homepage
    const allBlogs = await Blog.find({})    //returns an array
    //console.log(allBlogs);

    res.render("home", {
        user: req.user,
        blogs: allBlogs,
    }); //user was attached to req object by middleware 
})
app.listen(PORT, ()=>{
    console.log(`Server started at PORT: ${PORT}`);
})