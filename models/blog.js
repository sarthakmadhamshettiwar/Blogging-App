const {Schema, model} = require('mongoose');
const path = require('path')


const blogSchema = new Schema({
    title:{
        type:String,
        required: true,
    },
    body:{
        type:String, 
        required: true,
    },
    coverImageURL:{
        type: String,
        required: false,
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref:"user", //the name of the model by which reference is coming
    },
},{timestamps:true});

const Blog = model('blog', blogSchema);
module.exports = Blog;