if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  
  const express = require('express');
  const app = express();
  const bcrypt = require("bcrypt");
  const passport = require("passport");
  const initializePassport = require("./passport-config");
  const flash = require("express-flash");
  const session = require("express-session");
  const mongoose = require('mongoose'); // Import Mongoose for MongoDB interaction
  
  const { MongoClient, ServerApiVersion } = require('mongodb'); // Alternative (optional)
  
  // Replace with your actual MongoDB connection URI (obtained from MongoDB Atlas or local instance)
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Login';
  
 mongoose.connect(mongoURI, { })
  .then(() => { // Add curly braces here
    console.log('MongoDB connected successfully.');
  })
  .catch(err => console.error('MongoDB connection error:', err));

  
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
  });
  
  const User = mongoose.model('User', userSchema); // Create the User model
  
  const port = 3000;
  
  app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
  app.use(flash());
  app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false, // We wont resave the session variable if nothing is changed
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  initializePassport(
    passport,
    async (email) => await User.findOne({ email }),
    async (id) => await User.findById(id)
  );
  
  app.post("/signin", async (req, res) => {
    try {
        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            req.flash("error", "Invalid email format");
            return res.redirect("/signin");
        }

        const existingUser = await User.findOne({ $or: [{ email: req.body.email }, { name: req.body.name }] });
        if (existingUser) {
            if (existingUser.email === req.body.email) {
                req.flash("error", "Email already exists");
            } else if (existingUser.name === req.body.name) {
                req.flash("error", "Name already exists");
            }
            return res.redirect("/signin");
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10); // Hash the password
    
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword, // Store the hashed password
            });
    
            await newUser.save(); // Save the new user to the database
            console.log(newUser);
            res.redirect("/login");
        }
    } catch (e) {
        console.log(e);
        res.redirect("/signin");
    }
});



app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));
//ejs
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
    });

app.get('/buy', (req, res) => {
    res.render('buy');
    });

app.get('/comingsoon', (req, res) => {
    res.render('comingsoon');
    });

app.get('/login', (req, res) => {
    res.render('login');
    });

app.get('/signin', (req, res) => {
    res.render('signin');
    });

app.get('/watch', (req, res) => {
    res.render('watch');
    });


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});