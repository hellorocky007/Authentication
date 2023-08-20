require('dotenv').config();
const express = require("express");
const bodyParser  = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

// console.log(md5("124"));

app.use(session({
  secret: 'Rocky secret.',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://127.0.0.1:27017/UsersDB")
.then(()=>{
    console.log("Database connect successfull");
}).catch((err)=>{
    console.log(err);
})
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:["password"]});


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id); 
   // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(async function(id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/",function(req,res){
    res.render("home");
});
app.get("/auth/google",
passport.authenticate('google', { scope: ["profile"] })
);
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.get("/register",function(req,res){

    res.render("register");
});

app.get("/login",function(req,res){
    res.render("login");
});
app.get("/secrets",async function(req,res){
    try{
        const foundUsers = await User.find({"secret":{$ne:null}});
        if(foundUsers){
            res.render("secrets",{usersWithSecrets:foundUsers});
        }
    }catch(err){
        console.log(err);
    }
           
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit",async function(req,res){
    const submittedSecrets  = req.body.secret;
    console.log(req.user.id);
    try{
   const foundUser = await User.findById(req.user.id);
        
            if(foundUser){
                foundUser.secret = submittedSecrets;
               await foundUser.save();
                    res.redirect("/secrets");
                
            }
        }catch(err){
            console.log(err);
        }
            
        

});

app.get("/logout",(req,res,next)=>{
    req.logout(function(err){
        console.log(err);
        res.redirect("/");
    });
    
});
app.post("/register",function(req,res){

   User.register({username: req.body.username},req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register");
    }else{
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
  });
        
    }
   });

});
app.post("/login",function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    // This method comes from passport
    req.login(user,function(err){
        if(err){
           console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
        
    })

});
app.listen(3000,function(){
    console.log("server connected at 3000.");
})



    
// })
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// var bcrypt = require('bcryptjs');
// var salt = bcrypt.genSaltSync(10);
// var hash = bcrypt.hashSync("B4c9/\/",salt);


// bcrypt.genSalt(10,function(err,salt){
//     bcrypt.hash(req.body.password,salt,function(err,hash){
//         const newUser = new User({
//             email: req.body.username,
//             password:hash
//         });
//         newUser.save().then(()=>{
//             res.render("secrets");
//         }).catch((err)=>{
//             console.log(err);
//         })
//     })
// })


// const username = req.body.username;
// const password = req.body.password;
// User.findOne({email: username}).then(function(foundUser){
//     bcrypt.compare(password,foundUser.password, function(err, result) {
//         // res === true
//         if(result === true){
//             res.render("secrets");
//         }

//     });
   
// })
//  .catch((err)=>{
//     console.log(err);
//  })