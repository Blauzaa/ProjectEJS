if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  
  const express = require('express');
  const app = express();
  const bcrypt = require("bcrypt");
  const passport = require("passport");
  const initializePassport = require("./passport/passport-config");
  const flash = require("express-flash");
  const session = require("express-session");
  const mongoose = require('mongoose'); // Import Mongoose for MongoDB interaction
  const fs = require('fs');
  const moviesDir = './MovieData'; // Directory containing movie data JSON files
  const movieFile1 = `${moviesDir}/movie-data1.json`;
  const movieFile2 = `${moviesDir}/movie-data2.json`;
  const movieFile3 = `${moviesDir}/movie-data3.json`;
  const movieFile4 = `${moviesDir}/movie-data4.json`;
  
  
  // Replace with your actual MongoDB connection URI (obtained from MongoDB Atlas or local instance)
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Database';
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
  });
  
  const User = mongoose.model('User', userSchema); // Create the User model
  
  const movieSchema = new mongoose.Schema({
    name: String,
    rating: Number,
    genre: String,
    harga: Number, // Price in Indonesian Rupiah (assuming)
    poster: String, // Path to the poster image file (optional)
    video: String,  // Path to the video file (optional)
  });
  const Movie = mongoose.model('Movie', movieSchema);
  const Movie2 = mongoose.model('Movie2', movieSchema);
  const Movie3 = mongoose.model('Movie3', movieSchema);
  const Movie4 = mongoose.model('Movie4', movieSchema);


  async function getMovies() {
    try {
      const movies = await Movie.find(); // Get all movies from Movie collection
      return movies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  
  async function getComingSoonMovies() {
    try {
      const comingSoonMovies = await Movie2.find(); // Get all movies from Movie2 collection
      return comingSoonMovies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  
  async function getFreeMovies() {
    try {
      const freeMovies = await Movie3.find({ harga: 0 }); // Filter Movie3 for "free" movies (harga = 0)
      return freeMovies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async function getMainMovies() {
    try {
      const mainMovies = await Movie4.find(); // Get all movies from Movie4 collection
      return mainMovies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  
  async function createMovies(movies, collectionName) {
    const MovieModel = collectionName === '1' ? Movie : collectionName === '2' ? Movie2 : collectionName === '3' ? Movie3 : Movie4;
    try {
      for (const movie of movies) {
        const existingMovie = await MovieModel.findOne({ name: movie.name });
        if (!existingMovie) {
          const newMovie = new MovieModel(movie);
          await newMovie.save();
          console.log(`Movie "${movie.name}" added to collection "${collectionName}" successfully.`);
        } else {
          console.log(`Movie "${movie.name}" already exists in collection "${collectionName}". Skipping...`);
        }
      }
    } catch (error) {
      console.error("Error creating movies:", error);
    }
  }
  
  // Reading movie data from separate files
  fs.promises.readFile(movieFile1, 'utf-8')
    .then(data => {
      const movies = JSON.parse(data);
      createMovies(movies, '1'); // Add movies to collection 1
    })
    .catch(error => console.error('Error reading movie-data1.json:', error));
  
  fs.promises.readFile(movieFile2, 'utf-8')
    .then(data => {
      const movies = JSON.parse(data);
      createMovies(movies, '2'); // Add movies to collection 2
    })
    .catch(error => console.error('Error reading movie-data2.json:', error));
  
  fs.promises.readFile(movieFile3, 'utf-8')
    .then(data => {
      const movies = JSON.parse(data);
      createMovies(movies, '3'); // Add movies to collection 3
    })
    .catch(error => console.error('Error reading movie-data3.json:', error));
      
  fs.promises.readFile(movieFile4, 'utf-8')
  .then(data => {
    const movies = JSON.parse(data);
    createMovies(movies, '4'); // Add movies to collection 4
  })
  .catch(error => console.error('Error reading movie-data4.json:', error));

  
 mongoose.connect(mongoURI, { })
  .then(() => { // Add curly braces here
    console.log('MongoDB connected successfully.');
  })
  .catch(err => console.error('MongoDB connection error:', err));


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

app.get('/logout', (req, res) => {
  req.logout(() => {
      req.session.destroy(() => {
          req.app.locals.isLoggedIn = false; // Set isLoggedIn to false in application locals
          res.redirect('/'); // Redirect to the homepage after logout
      });
  });
});

app.get('/', async (req, res) => {
    try {
      const movies = await getMovies();
      const comingSoon = await getComingSoonMovies();
      const freeMovies = await getFreeMovies();
      const mainMovies = await getMainMovies();
      const isLoggedIn = !!req.user; // Check if user is logged in
      res.render('index', { movies, comingSoon, freeMovies, mainMovies, isLoggedIn }); // Pass movie data to the template
    } catch (error) {
      console.error(error);
      res.render('error'); // Handle errors appropriately
    }
  });


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
app.get('/logout', (req, res) => {
    res.render('logout');
    });
app.get('/watch', (req, res) => {
    res.render('watch');
    });


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});