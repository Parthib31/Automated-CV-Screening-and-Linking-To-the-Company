//Module declaration:
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fs = require("fs");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const { format } = require("path");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { MIMEType } = require("util");
const Docx = require("docx");
const mammoth = require("mammoth");

//File upload directory initialisation:
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

//app declaration:
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("uploads"));

//session initialisation:
app.use(
  session({
    secret: "thisissecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//mongoose connection:
mongoose.connect("mongodb://127.0.0.1:27017/formdatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//userSchema:
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

//passport authentication:
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Job application Schema:
const formSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  resume: String,
  coverletter: { type: String, required: true },
});
const Form1 = mongoose.model("Web_dev", formSchema);
const Form2 = mongoose.model("App_dev", formSchema);
const Form3 = mongoose.model("Data_Analyst", formSchema);

//Router definition:
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("index");
  } else {
    res.redirect("/login");
  }
});

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/home");
  } else {
    res.redirect("/login");
  }
});

app.get("/form", (req, res) => {
  res.render("user-form.ejs");
});

//user details post:
app.post("/register", async function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.error(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      }
    }
  );
});

app.post("/login", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(newUser, function (err) {
    if (err) {
      console.error(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

//job application post:
app.post("/form", upload.single("resume"), async (req, res) => {

  res.render("success");

  const formData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    resume: req.file.filename,
    coverletter: req.body.coverletter,
  };

  //Web Dev Company
  mammoth.extractRawText({ path: "./webDevDataset.docx" }).then(function (result1) {
    let text1 = result1.value;

    const filePath = path.join("./uploads", req.file.filename);
    mammoth.extractRawText({ path: filePath }).then(function (result2) {
      let text2 = result2.value;

      var ans = calculateMatchPercentage(text1, text2); //calculating match percentage
      console.log(ans);

      if (ans >= 60) {
        Form1.create(formData).then((item, err) => {
          if (err) {
            console.log(err);
          } else {
            item.save();
          }
        });
      }
    });
  });

  //App Dev Company
  mammoth.extractRawText({ path: "./appDevDataset.docx" }).then(function (result1) {
    let text1 = result1.value;

    const filePath = path.join("./uploads", req.file.filename);
    mammoth.extractRawText({ path: filePath }).then(function (result2) {
      let text2 = result2.value;

      var ans1 = calculateMatchPercentage(text1, text2); //calculating match percentage
      console.log(ans1);

      if (ans1 >= 60) {
        Form2.create(formData).then((item, err) => {
          if (err) {
            console.log(err);
          } else {
            item.save();
          }
        });
      }
    });
  });

  //Data Analyst Company
  mammoth.extractRawText({ path: "./DataAnalystDataset.docx" }).then(function (result1) {
    let text1 = result1.value;

    const filePath = path.join("./uploads", req.file.filename);
    mammoth.extractRawText({ path: filePath }).then(function (result2) {
      let text2 = result2.value;

      var ans2 = calculateMatchPercentage(text1, text2); //calculating match percentage
      console.log(ans2);

      if (ans2 >= 60) {
        Form3.create(formData).then((item, err) => {
          if (err) {
            console.log(err);
          } else {
            item.save();
          }
        });
      }
    });
  });
  
});

app.get("/web", function (req, res) {
  Form1.find({}).then((data, err) => {
    if (err) {
      console.log(err);
    }
    res.render("datas", { data: data });
  });
});

app.get("/app", function (req, res) {
  Form2.find({}).then((data, err) => {
    if (err) {
      console.log(err);
    }
    res.render("datas", { data: data });
  });
});

app.get("/data", function (req, res) {
  Form3.find({}).then((data, err) => {
    if (err) {
      console.log(err);
    }
    res.render("datas", { data: data });
  });
});

app.get("/company/:filename", function (req, res) {
  const filePath = path.join("./uploads", req.params.filename);
  const readStream = fs.createReadStream(filePath);
  res.setHeader(
    "Content-disposition",
    "attachment; filename=" + req.params.filename
  );
  readStream.pipe(res);
});

//Sever Declaration:
app.listen(3000, () => {
  console.log("Server started on port 3000");
});

//Function for calculating match percentage:
function calculateMatchPercentage(text1, text2) {
  const cleanText1 = text1
    .replace(/[.,\/#!$%\^&|\*;@:{}=\-_`~()]/g, "")
    .toLowerCase();
  const cleanText2 = text2
    .replace(/[.,\/#!$%\^&|\*;@:{}=\-_`~()]/g, "")
    .toLowerCase();

  //For resume:
  let wordArray1 = new Array(new Array());
  let wordArray2 = new Array(new Array());
  wordArray2[0] = [];

  var i = 0,
    j = 0;
  for (var k = 0; k < cleanText2.length; k++) {
    j = 0;
    if (cleanText2[k] !== " " && cleanText2[k] !== "\n") {
      wordArray2[i].push(cleanText2[k]);
      j++;
    } else if (cleanText2[k] === " " && cleanText2[k - 1] === " ") {
      continue;
    } else if (cleanText2[k] === "\n" && cleanText2[k - 1] === "\n") {
      continue;
    } else {
      i++;
      wordArray2[i] = [];
    }
  }

  //For dataset
  var i = 0,
    j = 0;
  wordArray1[0] = [];
  for (var k = 0; k < cleanText1.length; k++) {
    j = 0;
    if (cleanText1[k] !== " " && cleanText1[k] !== "\n") {
      wordArray1[i].push(cleanText1[k]);
      j++;
    } else if (cleanText1[k] === " " && cleanText1[k - 1] === " ") {
      continue;
    } else if (cleanText1[k] === "\n" && cleanText1[k - 1] === "\n") {
      continue;
    } else {
      i++;
      wordArray1[i] = [];
    }
  }

  //Calculating Matching percentage:
  let matched_pair = 0;

  for (
    var i = 0;
    i < wordArray1.length;
    i++ //dataset traverse
  ) {
    for (
      var j = 0;
      j < wordArray2.length;
      j++ //resume traverse
    ) {
      if (JSON.stringify(wordArray1[i]) === JSON.stringify(wordArray2[j])) {
        matched_pair++;
        break;
      }
    }
  }
  var ans = (matched_pair / wordArray1.length) * 100;
  return ans;
}