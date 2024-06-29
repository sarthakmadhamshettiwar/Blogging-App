const express = require("express");
const path = require('path'); // Added path module import
const Blog = require('../models/blog');
const multer = require('multer');

const router = express.Router();
router.use(express.static(path.resolve('./public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve('./public/uploads/'));
    },
    filename: function (req, file, cb) {
        const fileName = Date.now() + '-' + file.originalname;
        cb(null, fileName);
    },
});
const upload = multer({ storage: storage });

router.get('/myBlogs', async (req, res) => {
    if (req.user) {
        const allBlogs = await Blog.find({ createdBy: req.user._id });
        //works well
        res.render('myBlogs', {user: req.user, blogs: allBlogs});
    } else {
        res.send('No blogs right now');
    }
});

router.get('/delete/:blogID', async(req, res)=>{
    if(req.user){
        await Blog.deleteMany({_id: req.params.blogID});
    }
    res.redirect('/personal/myBlogs');
})

router.get('/update/:blogId', async (req, res)=>{
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId);
    res.render('updateBlog', {blog:blog, user:req.user});
});

router.post('/update/:blogId', upload.single('coverImage'), async(req, res)=>{
    const blogId = req.params.blogId;
    const filter = { _id: blogId };
    const update = { 
        title: req.body.title,
        body: req.body.body,
        coverImageURL: `uploads/${req.file.filename}`,
     };

    await Blog.findOneAndUpdate(filter, update, {
    returnOriginal: false
    });
    res.redirect('/');
});

module.exports = router;

