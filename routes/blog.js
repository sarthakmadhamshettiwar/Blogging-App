const express = require("express");
const multer = require('multer'); // Corrected import
const Redis = require('redis');
const path = require('path'); // Added path module import
const Blog = require('../models/blog');
const Comment = require('../models/comment');   //Each blog will have comments associated with it
const DEFAULT_EXPIRATION = 3600;
const router = express.Router();


imagesPath = path.join(__dirname, '..', 'public');
router.use(express.static(imagesPath));

//Using Redis for caching
// const client = Redis.createClient();

const client = Redis.createClient({
    legacyMode: true,
    //PORT: 5001
  })
client.connect().catch(console.error)


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


router.get("/:id", async (req, res) => {
    const blogKey = `blog:${req.params.id}`;
    //const commentKey = `comment:${req.params.id}`;

    const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");

    client.exists(blogKey, async (err, reply) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Internal Server Error');
        } else {
            if (reply === 1) {
                client.get(blogKey, (err, blogData) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send('Internal Server Error');
                    }
                    try {
                        const blog = JSON.parse(blogData);
                        console.log('Cache hit');
                        res.render('blog', { user: req.user, blog, comments });
                    } catch (parseErr) {
                        console.log('Error parsing cached blog data:', parseErr);
                        return res.status(500).send('Internal Server Error');
                    }
                });
            } else {
                const blog = await Blog.findById(req.params.id).populate("createdBy");
                client.setEx(blogKey, DEFAULT_EXPIRATION, JSON.stringify(blog), (err) => {
                    if (err) {
                        console.log('Error setting cache:', err);
                    }
                });
                console.log('Cache miss');
                res.render('blog', { user: req.user, blog, comments });
            }
        }
    });
});


router.post("/comment/:blogId", async (req, res)=>{
    //console.log(req.body.content)
    await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });

    return res.redirect(`/blog/${req.params.blogId}`);
});

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

router.get("/search/:query", async (req, res)=>{
    //const blogs = await Blog.find({$text:{$search:req.params.query}});
    console.log(req.param.query);
    const blogs = {'title':'Bello'};
    console.log("hllo");
    //res.render('searchedBlogs',{searchQuery: req.params.query, blogs:blogs, user:req.user});
    res.send('Hello Worl');
})
module.exports = router;
