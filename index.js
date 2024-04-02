const express = require('express');
const app = express();
const flash = require("express-flash");
const session = require("express-session");
const passport = require("passport");
const initializePassport = require("./passport/passport-config");
const mongoose = require('mongoose');
const fs = require('fs');
const User = require("./models/user");
const { Movie, Movie2, Movie3, Movie4 } = require("./models/movie"); // Import all necessary models
const authController = require("./controllers/authController");
const { getMovies, getComingSoonMovies, getFreeMovies, getMainMovies } = require("./controllers/movieController");
const bcrypt = require("bcrypt");

// Load environment variables in development mode
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

  
// Define the port for the server
const port = process.env.PORT || 3000;

// Define the MongoDB URI
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Database';

// Export the Express app and MongoDB URI for testing purposes
module.exports = {
  app,
  mongoURI
};

  
// Konfigurasi middleware Express dan Passport.js
app.use(express.urlencoded({ extended: false })); // Middleware untuk parsing URL-encoded bodies
app.use(flash()); // Middleware untuk mengelola pesan flash
app.use(session({ // Middleware untuk manajemen session
  secret: process.env.SECRET_KEY, // Secret key untuk session
  resave: false, // Tidak menyimpan ulang session jika tidak ada perubahan
  saveUninitialized: false // Tidak menyimpan session yang tidak diinisialisasi
}));
app.use(passport.initialize()); // Middleware untuk menginisialisasi Passport.js
app.use(passport.session()); // Middleware untuk menggunakan session dengan Passport.js

initializePassport( // Menginisialisasi Passport.js
  passport, // Objek Passport.js
  async (email) => await User.findOne({ email }), // Fungsi untuk mendapatkan pengguna berdasarkan email
  async (id) => await User.findById(id) // Fungsi untuk mendapatkan pengguna berdasarkan ID
);

  // Route to handle user sign-up
app.post("/signin", authController.signUp);


// Rute untuk menangani proses login pengguna
app.post("/login", passport.authenticate("local", {
  successRedirect: "/", // Redirect ke halaman utama jika berhasil
  failureRedirect: "/login", // Redirect ke halaman login jika gagal
  failureFlash: true // Menggunakan pesan flash untuk informasi kegagalan
}));
// Rute untuk logout pengguna
app.get('/logout', (req, res) => {
  req.logout(() => {
      req.session.destroy(() => {
          req.app.locals.isLoggedIn = false; // Set isLoggedIn to false in application locals
          res.redirect('/'); // Redirect to the homepage after logout
      });
  });
});

// Rute untuk halaman utama
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
// Rute untuk menampilkan detail film di halaman watch
  app.get('/watch', async (req, res) => {
    try {
        const movieId = req.query.movieId; // Mengambil ID film dari parameter query
        // Gunakan ID untuk mengambil data film dari database
        const selectedMovie = await Movie3.findById(movieId);
        const isLoggedIn = !!req.user; // Check if user is logged in
        res.render('watch', { selectedMovie, isLoggedIn }); // Pass movie data to the template
    } catch (error) {
        console.error(error);
        res.render('error'); // Handle errors appropriately
    }
});
// Rute untuk menampilkan detail film di halaman comingsoon
  app.get('/comingsoon', async (req, res) => {
    try {
      const movieId = req.query.movieId; // Mengambil ID film dari parameter query
      // Gunakan ID untuk mengambil data film dari database
      const selectedMovie = await Movie2.findById(movieId);
      const isLoggedIn = !!req.user; // Check if user is logged in
      res.render('comingsoon', { selectedMovie, isLoggedIn }); // Pass movie data to the template
    } catch (error) {
      console.error(error);
      res.render('error'); // Handle errors appropriately
    }
  });
// Rute untuk menampilkan detail film di halaman buy
  app.get('/buy', async (req, res) => {
    try {
      const movieId = req.query.movieId; // Mengambil ID film dari parameter query
      // Gunakan ID untuk mengambil data film dari database
      const selectedMovie = await Movie.findById(movieId);
      const isLoggedIn = !!req.user; // Check if user is logged in
      res.render('buy', { selectedMovie, isLoggedIn }); // Pass movie data to the template
    } catch (error) {
      console.error(error);
      res.render('error'); // Handle errors appropriately
    }
  });


  mongoose.connect(mongoURI, { }) // Menghubungkan ke MongoDB menggunakan URI yang ditentukan
  .then(() => { // Mengonfirmasi koneksi berhasil
    console.log('MongoDB connected successfully.');
  })
  .catch(err => console.error('MongoDB connection error:', err));

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