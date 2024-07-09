const express = require("express");
const path = require('path'); // Added path module import
const Blog = require('../models/blog');
const multer = require('multer');
const Redis = require('redis');
const DEFAULT_EXPIRATION = 3600;
const fs = require('fs');

const router = express.Router();
router.use(express.static(path.resolve('./public')));

const client = Redis.createClient({
    legacyMode: true,
});
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
        const blog = await Blog.findOneAndDelete({_id: req.params.blogID});
        //also delete images from the folder if possible 
        const imageUrl = path.join(__dirname, '..', 'public', blog.coverImageURL);
        try{
            fs.unlink(imageUrl, (err)=>{
                if(err) throw err;
                console.log('Image deleted');
            })
        }
        catch(err){
            console.log(err);
        }
    }
    res.redirect('/personal/myBlogs');
})

router.get('/update/:blogId', async (req, res)=>{
    if(!req.user){
        res.redirect('/');
    }
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId);
    //console.log(req.user);
    //if(blog.createdBy !== req.user.)
    res.render('updateBlog', {blog:blog, user:req.user});
});

router.post('/update/:blogId', upload.single('coverImage'), async (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }

    const blogId = req.params.blogId;

    try {
        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).send('Blog not found');
        }

        if (blog.createdBy.toString() !== req.user._id) {
            //console.log("Illegal user is trying to update blog");
            return res.status(403).send('Unauthorized');
        }

        const imageUrl = path.join(__dirname, '..', 'public', blog.coverImageURL);

        if (req.file) {
            // Delete the old cover image if a new one is uploaded
            fs.unlink(imageUrl, (err) => {
                if (err) throw err;
                //console.log('Old image deleted');
            });
        }

        // Update the blog with new data
        const update = {
            title: req.body.title,
            body: req.body.body,
            coverImageURL: req.file ? `uploads/${req.file.filename}` : blog.coverImageURL,
        };

        const updatedBlog = await Blog.findByIdAndUpdate(blogId, update, { new: true });

        const blogKey = `blog:${req.params.blogId}`;
        //console.log(blogKey);
        client.exists(blogKey, async (err, result)=>{
            if (err) {
                //console.log(err);
                return res.status(500).send('Internal Server Error');
            } else {
                client.del(blogKey);
                client.setEx(blogKey, DEFAULT_EXPIRATION, JSON.stringify(updatedBlog), (err)=>{
                    if(err){
                        console.log('Error setting cache:', err);
                    }
                    //use else for debugging
                });
            }
        });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;

