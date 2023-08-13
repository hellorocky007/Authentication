require('dotenv').config();
const express = require("express");
const bodyParser  = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync("B4c9/\/",salt);
const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

// console.log(md5("124"));
mongoose.connect("mongodb://127.0.0.1:27017/UsersDB")
.then(()=>{
    console.log("Database connect successfull");
}).catch((err)=>{
    console.log(err);
})
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});


userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:["password"]});


const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
})
app.get("/login",function(req,res){
    res.render("login");
})
app.get("/register",function(req,res){


    res.render("register");
})
app.get("/login",function(req,res){
    res.render("login");
})
app.post("/register",function(req,res){
    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(req.body.password,salt,function(err,hash){
            const newUser = new User({
                email: req.body.username,
                password:hash
            });
            newUser.save().then(()=>{
                res.render("secrets");
            }).catch((err)=>{
                console.log(err);
            })
        })
    })
    
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username}).then(function(foundUser){
        bcrypt.compare(password,foundUser.password, function(err, result) {
            // res === true
            if(result === true){
                res.render("secrets");
            }

        });
        
    })
    .catch((err)=>{
        console.log(err);
    })
})

app.listen(3000,function(){
    console.log("server connected at 3000.");
})