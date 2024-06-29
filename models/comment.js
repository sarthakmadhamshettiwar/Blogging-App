const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "blog",  //name of the the blog on which comment is done
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",  //name of the user who have commented
    },
  },
  { timestamps: true }
);

const Comment = model("comment", commentSchema);

module.exports = Comment;
