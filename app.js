const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs=require("fs");
const multer=require("multer");
const { exec } = require('child_process');
const path = require('path');
const { format } = require('path');
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname));
  }
});

const upload = multer({ storage:storage });

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine","ejs");
app.use(express.static('public'));
// app.use(express.static('Images'));
app.use(express.static('uploads'));

app.use(session({
  secret: 'thisissecret',
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://parthib:formDB%40123@jobdb.ogpinmf.mongodb.net/formdatabase', { useNewUrlParser: true, useUnifiedTopology: true });

//userSchema:
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Job application Schema:
const dataSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone:Number,
  coverletter: String,
  resumeName:String
});
const Data = mongoose.model('Data', dataSchema);

//Router definition:
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/logout",function(req,res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

app.get("/home", (req, res) => {
  if(req.isAuthenticated()){
    res.render("index");
  } else{
    res.redirect("/login");
  }
});

app.get('/', (req, res) => {
  if(req.isAuthenticated()){
    res.redirect("/home");
  } else{
    res.redirect("/login");
  }
});

app.get('/form', (req, res) => {
  res.render("user-form.ejs");
  // res.render("success.ejs");  
});

//user details post:
app.post("/register", async function (req, res) {
  
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err)
    {
      console.error(err);
      res.redirect("/register");
    }
    else
    {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/home");
      });
    }
  })
});

app.post("/login", async (req, res) => {
  const newUser=new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(newUser,function(err){
    if(err)
    {
      console.error(err);
      res.redirect("/login");
    } else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/home");
      });
    }
  })
});

//job application post:
app.post('/form',upload.single('resume'), async (req, res) => {
  if(req.file){
    const data = new Data({
      name: req.body.name,
      email: req.body.email,
      phone:req.body.phone,
      coverletter:req.body.coverletter,
      resumeName:req.file.filename
    });
      await data.save();
      res.render('success.ejs');   
  
}else{
  console.log("error");
}
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
