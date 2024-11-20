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

//Email Notification
const {Worker} =  require("bullmq");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const sendEmail = (msg)=>{
    try{sgMail
        .send(msg)
        .then(()=>{
            console.log('Email sent')
        })
        .catch((err) => {
            console.log(`error: `, err)
        })
    }
    catch(err){
        console.log(err);
    }
}
const worker = new Worker('email_queue', async (job) => {
    console.log('Message recieved with ID: ', job.id);
    console.log('Sending message to ', job.data.to);
    await sendEmail(job.data);
}, {connection: {
    host: '127.0.0.1',
    port: '6379'
}, autorun:false});


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
    worker.run();
    console.log(`Server started at PORT: ${PORT}`);
})
