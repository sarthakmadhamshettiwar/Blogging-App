const express = require("express");
const multer = require('multer'); // Corrected import
const path = require('path'); // Added path module import
const Blog = require('../models/blog');
const Comment = require('../models/comment');   //Each blog will have comments associated with it

const router = express.Router();
router.use(express.static(path.resolve('./public')));
// app.use(express.static(path.resolve('./public')));

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

router.get("/add-new", (req, res) => {
    return res.render('addBlog', { user: req.user });
});
router.get("/:id", async(req, res)=>{
    //fetch comments as well while rendering the blog
    const comments = await Comment.find({blogId: req.params.id}).populate("createdBy");
    //console.log(comments);
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    res.render('blog', {user:req.user, blog:blog, comments});
});
router.post("/comment/:blogId", async (req, res)=>{
    //console.log(req.body.content)
    await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });

    return res.redirect(`/blog/${req.params.blogId}`);
})
router.post("/", upload.single('coverImage'), async (req, res) => {
    // console.log(req.body);   //print details of the body
    // console.log(req.file);   //print details of the file uploaded including the path where it is saved and filename
    const {title, body} = req.body;
    const blog = await Blog.create({
        body, 
        title,
        createdBy: req.user._id,
        coverImageURL: `uploads/${req.file.filename}`,
    });
    return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;
