const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs=require("fs");
const multer=require("multer");
const { exec } = require('child_process');
const path = require('path');
const { format } = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname));
  }
});

const upload = multer({ storage:storage });

mongoose.connect('mongodb+srv://parthib:formDB%40123@jobdb.ogpinmf.mongodb.net/formdatabase', { useNewUrlParser: true, useUnifiedTopology: true });

const dataSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone:Number,
  coverletter: String,
  resumeName:String
});

const Data = mongoose.model('Data', dataSchema);

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine","ejs");
app.use(express.static('public'));
// app.use(express.static('Images'));
app.use(express.static('uploads'));

app.get('/', (req, res) => {
  res.render("index.ejs");
});

app.get('/form', (req, res) => {
  res.render("user-form.ejs");
  // res.render("success.ejs");  
});

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
