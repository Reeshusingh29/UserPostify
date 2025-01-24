const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/miniproject");

const userschema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profilepic:{
       type:String,
       default: "default.png"   //iss line ka matlab hai ki jab ham user ka profilepic banayege toh by default uski profile pic hogi ye default.png
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]

});

module.exports = mongoose.model('user', userschema);
