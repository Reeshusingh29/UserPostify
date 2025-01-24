const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usermodel = require('./models/user');
const postmodel = require('./models/post');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto')
const multerconfig = require('./config/multerconfig');
const upload = require('./config/multerconfig');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser());

 



app.get("/", (req, res) => {
    res.render("index");
});

app.get("/profile/upload",(req,res)=>{
    res.render("profileupload")
})
/*
app.post("/upload",isloggedin,upload.single("Image"),async (req,res)=>{
    //console.log(req.file);
   let user =  await usermodel.findOne({email:req.user.email});
   user.profilepic = req.file.filename
   await user.save()
   res.redirect("/profile")
})*/
app.post("/upload", isloggedin, upload.single("Image"), async (req, res) => {
  let user = await usermodel.findOne({ email: req.user.email });
  if (req.file) {
    user.profilepic = req.file.filename;
    await user.save();
  }
  res.redirect("/profile");
});


app.get("/upload",(req,res)=>{
    res.render("profileupload")
})

app.get("/login", (req, res) => {
    res.render("login");
});



app.get("/profile", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email }).populate("posts");
    res.render("profile", { user });
});




app.post("/profile", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email });
    let { content } = req.body;

    let post = await postmodel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);  // Corrected line: push to "posts" array
    await user.save();
    res.redirect("/profile");
});
/*
app.get("/like/:id", isloggedin ,async(req,res)=>{
    let post = await postmodel.findOne({ _id:req.params.id }).populate("user");

    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid)
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    post.likes.push(req.user.userid)
    await post.save()
    res.redirect("/profile")
})
*/
app.get("/like/:id", isloggedin, async (req, res) => {
    let post = await postmodel.findOne({ _id: req.params.id });

    // Check if user already liked the post
    const userIndex = post.likes.indexOf(req.user.userid);

    if (userIndex === -1) {
        // User hasn't liked the post yet, so add their ID to the likes array
        post.likes.push(req.user.userid);
    } else {
        // User has liked the post already, so remove their ID from the likes array
        post.likes.splice(userIndex, 1);
    }

    await post.save();  // Save the post with the updated likes
    res.redirect("/profile");
});

app.get("/edit/:id", isloggedin ,async(req,res)=>{
    let post = await postmodel.findOne({ _id:req.params.id }).populate("user");

     res.render("edit",{post})
})

app.post("/update/:id", isloggedin ,async(req,res)=>{
    let post = await postmodel.findOneAndUpdate({ _id:req.params.id },{content: req.body.content})
    res.redirect("/profile")

    
})

app.post("/register", async (req, res) => {
    let { email, password, username, name, age } = req.body;

    let user = await usermodel.findOne({ email });

    if (user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10, async (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await usermodel.create({
                username,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.send("Registered");
        });
    });
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    let user = await usermodel.findOne({ email });

    if (!user) return res.status(500).send("Something went wrong!");

    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

app.get("/test",(req,res)=>{
    res.render("test");
})


function isloggedin(req, res, next) {
    //console.log(req.cookies);
    
    if (req.cookies.token === "") {
        return res.redirect("/login");
    } else {
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    }
}
app.listen(3000);
