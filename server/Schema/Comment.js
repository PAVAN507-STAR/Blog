import mongoose, { Schema } from "mongoose";

const commentSchema = mongoose.Schema({

blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
    blog_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'blogs'
    },
    blog_author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'blogs',
    },
    comment: {
        type: String,
        required: true
    },
    children: {
        type: [Schema.Types.ObjectId],
        ref: 'comments'
    },
    commented_by: {
        type: Schema.Types.ObjectId,
        require: true,
        ref: 'users'
    },
    parent_comment: {
        type: Schema.Types.ObjectId,
        ref: 'comments',
        default: null
    },
    replies: [{
        type: Schema.Types.ObjectId,
        ref: 'comments'
    }],
    isReply: {
        type: Boolean,
        default: false
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'comments'
    }

},
{
    timestamps: {
        createdAt: 'commentedAt'
    }
})

export default mongoose.model("comments", commentSchema)