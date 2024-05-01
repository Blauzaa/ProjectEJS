const express = require('express');
const app = express();
const flash = require("express-flash");
const session = require("express-session");
const passport = require("passport");
const {initialize, ensureAuthenticated, verifyToken, generateToken} = require("./passport/passport-config");
const mongoose = require('mongoose');
const fs = require('fs');
const User = require("./models/user");
const { Movie, Movie2, Movie3, Movie4 } = require("./models/movie"); // Import all necessary models
const authController = require("./controllers/authController"); 
const { getMovies, getComingSoonMovies, getFreeMovies, getMainMovies } = require("./controllers/movieController");
const movieController = require('./controllers/movieController');
const bodyParser = require('body-parser');
const multer = require('multer');
const websiteController = require('./controllers/websiteController');
const checkSubscriptionStatus  = require('./controllers/subsController.js');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));

// Load environment variables in development mode
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


  
// Define the port for the server
const port = process.env.PORT;

// Define the MongoDB URI
const mongoURI = process.env.MONGO_URI;

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

initialize( // Menginisialisasi Passport.js
  passport, // Objek Passport.js
  async (email) => await User.findOne({ email }), // Fungsi untuk mendapatkan pengguna berdasarkan email
  async (id) => await User.findById(id) // Fungsi untuk mendapatkan pengguna berdasarkan ID
);

  // Route to handle user sign-up
app.post("/signin", authController.signUp);


// Rute untuk menangani proses login pengguna
app.post("/login", passport.authenticate("local", {
  failureRedirect: "/login", // Redirect ke halaman login jika gagal
  failureFlash: true // Menggunakan pesan flash untuk informasi kegagalan
}), (req, res) => {
  // Setelah berhasil login, arahkan ke halaman yang sesuai berdasarkan peran pengguna (admin atau bukan)
  if (req.user.admin) {
    const token = generateToken(req.user); 
    res.cookie('jwt', token, { httpOnly: true });
    res.redirect("/admin");
  } else {
    const token = generateToken(req.user); 
    res.cookie('jwt', token, { httpOnly: true }); // Set cookie dengan token JWT
    res.redirect("/");
  }
});





// Rute untuk logout pengguna
app.get('/logout', (req, res) => {
  req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('jwt');
          req.app.locals.isLoggedIn = false; // Set isLoggedIn to false in application locals
          res.redirect('/'); // Redirect to the homepage after logout
      });
  });
});

app.get('/', verifyToken, async (req, res) => {
  try {
    const { search } = req.query;
    let searchResults = [];
    let iscomingsoon = false;
    let isadmin = false; // Tambahkan variabel isadmin dan inisialisasi dengan false

    if (search) {
      // Search in all movie models for title matching the search query
      const movieSearchResults = await Promise.all([
        Movie.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie2.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie3.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie4.find({ name: { $regex: search, $options: 'i' } }).exec()
      ]);
      // Flatten and filter out null values
      searchResults = movieSearchResults.flat().filter(result => result !== null);

      // If no search results found, log a message to console
      if (searchResults.length === 0) {
        console.log(`No search results found for query: ${search}`);
      } else {
        // Check if search results are from Movie2
        searchResults.forEach(result => {
          if (result instanceof Movie2) {
            iscomingsoon = true;
          }
        });
      }
    }

    // Check if user is admin based on email
    if (req.user && req.user.email === '111@admin.com') {
      isadmin = true;
    }

    const movies = await getMovies();
    const comingSoon = await getComingSoonMovies();
    const freeMovies = await getFreeMovies();
    const mainMovies = await getMainMovies();
    const isLoggedIn = !!req.user; // Check if user is logged in
    const moviesBought = req.user.alrbuy;
    const userSubs = req.user.subs;
    // untuk menghitung sisa hari langganan
    const user = req.user;
    const userId = req.user._id;
    const now = new Date();
    const subEndDate = new Date(user.subsenddate);
    const diffTime = subEndDate - now;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if(diffDays < 0){
      const diffday = 0;
      diffDays = diffday;

    }
    res.render('index', { movies, comingSoon, freeMovies, mainMovies, isLoggedIn, moviesBought, userSubs, searchResults, iscomingsoon, isadmin, userId, user, diffDays  }); // Pass movie data to the template
  } catch (error) {
    console.error(error);
    res.render('error'); // Handle errors appropriately
  }
});



// Rute untuk menampilkan detail film di halaman watch
app.get('/watch', verifyToken , async (req, res) => {
  try {
    const { search } = req.query;
    let searchResults = [];
    let iscomingsoon = false; // Tambahkan variabel iscomingsoon
    let isadmin = false;
    if (search) {
      // Search in all movie models for title matching the search query
      const movieSearchResults = await Promise.all([
        Movie.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie2.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie3.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie4.find({ name: { $regex: search, $options: 'i' } }).exec()
      ]);
      // Flatten and filter out null values
      searchResults = movieSearchResults.flat().filter(result => result !== null);

      // If no search results found, log a message to console
      if (searchResults.length === 0) {
        console.log(`No search results found for query: ${search}`);
      } else {
        // Check if search results are from Movie2
        searchResults.forEach(result => {
          if (result instanceof Movie2) {
            iscomingsoon = true;
          }
        });
      }
    }

    // Check if user is admin based on email
    if (req.user && req.user.email === '111@admin.com') {
      isadmin = true;
    }

    const movieId = req.query.movieId; // Mengambil ID film dari parameter query
    const season = req.query.season; // Mengambil nilai season dari parameter query
    const episode = req.query.episode; // Mengambil nilai episode dari parameter query
    const moviesBought = req.user.alrbuy;
    const userSubs = req.user.subs;
    // Gunakan ID untuk mencari data film dari keempat koleksi
    const selectedMovie = await Promise.all([
      Movie.findById(movieId),
      Movie2.findById(movieId),
      Movie3.findById(movieId),
      Movie4.findById(movieId)
    ]);

    // Loop through the result to find the movie from the first collection where it's found
    let foundMovie;
    for (const movie of selectedMovie) {
      if (movie !== null) {
        foundMovie = movie;
        break;
      }
    }
        // untuk menghitung sisa hari langganan
    const user = req.user;
    const userId = req.user._id;
    const now = new Date();
    const subEndDate = new Date(user.subsenddate);
    const diffTime = subEndDate - now;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if(diffDays < 0){
      const diffday = 0;
      diffDays = diffday;

    }
    const isLoggedIn = !!req.user; // Check if user is logged in
    res.render('watch', { selectedMovie: foundMovie, isLoggedIn, season, episode, searchResults, iscomingsoon, moviesBought, userSubs, movieId, isadmin, user, userId, diffDays }); // Pass movie data to the template
  } catch (error) {
    console.error(error);
    res.render('error'); // Handle errors appropriately
  }
});



// Rute untuk menampilkan detail film di halaman comingsoon
app.get('/comingsoon', verifyToken , async (req, res) => {
  try {
    const { search } = req.query;
    let searchResults = [];
    let iscomingsoon = false; // Tambahkan variabel iscomingsoon
    let isadmin = false;
    if (search) {
      // Search in all movie models for title matching the search query
      const movieSearchResults = await Promise.all([
        Movie.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie2.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie3.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie4.find({ name: { $regex: search, $options: 'i' } }).exec()
      ]);
      // Flatten and filter out null values
      searchResults = movieSearchResults.flat().filter(result => result !== null);

      // If no search results found, log a message to console
      if (searchResults.length === 0) {
        console.log(`No search results found for query: ${search}`);
      } else {
        // Check if search results are from Movie2
        searchResults.forEach(result => {
          if (result instanceof Movie2) {
            iscomingsoon = true;
          }
        });
      }
    }
        // Check if user is admin based on email
  if (req.user && req.user.email === '111@admin.com') {
    isadmin = true;
  }
    const movieId = req.query.movieId; // Mengambil ID film dari parameter query
    // Gunakan ID untuk mengambil data film dari database
    const selectedMovie = await Promise.all([
      Movie.findById(movieId),
      Movie2.findById(movieId),
      Movie3.findById(movieId),
      Movie4.findById(movieId)
    ]);

    // Loop through the result to find the movie from the first collection where it's found
    let foundMovie;
    for (const movie of selectedMovie) {
      if (movie !== null) {
        foundMovie = movie;
        break;
      }
    }
        // untuk menghitung sisa hari langganan
    const user = req.user;
    const userId = req.user._id;
    const now = new Date();
    const subEndDate = new Date(user.subsenddate);
    const diffTime = subEndDate - now;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if(diffDays < 0){
      const diffday = 0;
      diffDays = diffday;

    }
    const isLoggedIn = !!req.user; // Check if user is logged in
    const moviesBought = req.user.alrbuy;
    const userSubs = req.user.subs;
    res.render('comingsoon', { selectedMovie: foundMovie, isLoggedIn, searchResults, iscomingsoon, moviesBought, userSubs, movieId, isadmin, user, userId, diffDays }); // Pass movie data to the template
  } catch (error) {
    console.error(error);
    res.render('error'); // Handle errors appropriately
  }
});
// Rute untuk menampilkan detail film di halaman buy
  app.get('/buy', verifyToken , async (req, res) => {
    try {
      const { search } = req.query;
    let searchResults = [];
    let iscomingsoon = false; // Tambahkan variabel iscomingsoon
    let isadmin = false;
    if (search) {
      // Search in all movie models for title matching the search query
      const movieSearchResults = await Promise.all([
        Movie.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie2.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie3.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie4.find({ name: { $regex: search, $options: 'i' } }).exec()
      ]);
      // Flatten and filter out null values
      searchResults = movieSearchResults.flat().filter(result => result !== null);

      // If no search results found, log a message to console
      if (searchResults.length === 0) {
        console.log(`No search results found for query: ${search}`);
      } else {
        // Check if search results are from Movie2
        searchResults.forEach(result => {
          if (result instanceof Movie2) {
            iscomingsoon = true;
          }
        });
      }
    }
        // Check if user is admin based on email
    if (req.user && req.user.email === '111@admin.com') {
      isadmin = true;
    }
    const moviesBought = req.user.alrbuy;
    const userSubs = req.user.subs;
      const movieId = req.query.movieId; // Mengambil ID film dari parameter query
      // Gunakan ID untuk mengambil data film dari database
         // Gunakan ID untuk mencari data film dari keempat koleksi
    const selectedMovie = await Promise.all([
      Movie.findById(movieId),
      Movie2.findById(movieId),
      Movie3.findById(movieId),
      Movie4.findById(movieId)
    ]);

    // Loop through the result to find the movie from the first collection where it's found
    let foundMovie;
    for (const movie of selectedMovie) {
      if (movie !== null) {
        foundMovie = movie;
        break;
      }
    }
        // untuk menghitung sisa hari langganan
    const user = req.user;
    const userId = req.user._id;
    const now = new Date();
    const subEndDate = new Date(user.subsenddate);
    const diffTime = subEndDate - now;
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if(diffDays < 0){
      const diffday = 0;
      diffDays = diffday;

    }
      const isLoggedIn = !!req.user; // Check if user is logged in
      res.render('buy', { selectedMovie: foundMovie, isLoggedIn, searchResults, iscomingsoon, moviesBought, userSubs, movieId, isadmin, userId, user, diffDays }); // Pass movie data to the template
    } catch (error) {
      console.error(error);
      res.render('error'); // Handle errors appropriately
    }
  });


  // Rute untuk menampilkan halaman pembayaran
// Rute untuk menampilkan halaman pembayaran
app.get('/payment', async (req, res) => {
  try {
    const { search } = req.query;
    let searchResults = [];
    let iscomingsoon = false; // Tambahkan variabel iscomingsoon
    let isadmin = false;
    if (search) {
      // Search in all movie models for title matching the search query
      const movieSearchResults = await Promise.all([
        Movie.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie2.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie3.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie4.find({ name: { $regex: search, $options: 'i' } }).exec()
      ]);
      // Flatten and filter out null values
      searchResults = movieSearchResults.flat().filter(result => result !== null);

      // If no search results found, log a message to console
      if (searchResults.length === 0) {
        console.log(`No search results found for query: ${search}`);
      } else {
        // Check if search results are from Movie2
        searchResults.forEach(result => {
          if (result instanceof Movie2) {
            iscomingsoon = true;
          }
        });
      }
    }
        // Check if user is admin based on email
        if (req.user && req.user.email === '111@admin.com') {
          isadmin = true;
        }
      // Pastikan pengguna sudah login dan req.user tidak null
      if (req.isAuthenticated()) {
          // Dapatkan informasi pengguna dari objek req.user yang sudah di-deserialize
          const user = req.user;

          // Dapatkan ID film dari parameter query
          const movieId = req.query.movieId;

          // Periksa apakah pengguna sudah membeli film tersebut sebelumnya
          if (user.alrbuy.includes(movieId)) {
              // Jika sudah membeli, langsung arahkan ke halaman watch dengan ID film tersebut
              res.redirect(`/watch?movieId=${movieId}`);
              return;
          }

          const selectedMovie = await Promise.all([
            Movie.findById(movieId),
            Movie2.findById(movieId),
            Movie3.findById(movieId),
            Movie4.findById(movieId)
          ]);
          let foundMovie;
          for (const movie of selectedMovie) {
            if (movie !== null) {
              foundMovie = movie;
              break;
            }
          }
              // untuk menghitung sisa hari langganan

          const userId = req.user._id;
          const now = new Date();
          const subEndDate = new Date(user.subsenddate);
          const diffTime = subEndDate - now;
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if(diffDays < 0){
            const diffday = 0;
            diffDays = diffday;
      
          }
          const moviesBought = req.user.alrbuy;
          const userSubs = req.user.subs;
          const isLoggedIn = !!req.user;
          // Render halaman pembayaran dengan menyertakan data uang
          res.render('payment', { selectedMovie: foundMovie, isLoggedIn, userMoney: user.uang, searchResults, iscomingsoon, moviesBought, userSubs, movieId, isadmin, user, userId, diffDays});
      } else {
          // Jika pengguna belum login, redirect ke halaman login
          res.redirect('/login');
      }
  } catch (error) {
      console.error(error);
      res.render('error'); // Handle errors appropriately
  }
});




// Rute untuk menangani checkout
app.post('/checkout', async (req, res) => {
  try {
    const movieId = req.query.movieId; // Mengambil ID film dari parameter query
    const selectedMovie = await Promise.all([
      Movie.findById(movieId),
      Movie2.findById(movieId),
      Movie3.findById(movieId),
      Movie4.findById(movieId)
    ]); // Mengambil data film dari database
    let foundMovie;
    for (const movie of selectedMovie) {
      if (movie !== null) {
        foundMovie = movie;
        break;
      }
    }

    if (!foundMovie) {
      return res.status(404).send('Movie not found');
    }

    // Dapatkan informasi pengguna dari objek req.user yang sudah di-deserialize
    const user = req.user;

    // Periksa apakah pengguna memiliki cukup uang untuk membeli film
    if (user.uang < foundMovie.harga) {
      return res.status(403).send('Insufficient funds');
    }

    // Periksa apakah pengguna sudah memiliki film tersebut
    if (user.alrbuy.includes(movieId)) {
      // Jika sudah, langsung arahkan ke halaman watch
      res.redirect(`/watch?movieId=${movieId}`);
      return;
    }

    // Kurangi uang pengguna dengan harga film
    user.uang -= foundMovie.harga;

    // Tambahkan ID film yang sudah dibeli ke dalam array alrbuy pengguna
    user.alrbuy.push(movieId);

    // Simpan perubahan pada pengguna ke dalam database
    await user.save();

    // Cari akun admin yang terkait
    const adminUser = await User.findOne({ email: '111@admin.com' });

    // Tambahkan jumlah uang yang sudah dikurangi dari pengguna ke saldo uang admin
    adminUser.uang += foundMovie.harga;

    // Simpan perubahan saldo uang admin ke dalam database
    await adminUser.save();

    const token = generateToken(req.user);
    res.cookie('jwt', token, { httpOnly: true });

    // Redirect pengguna ke halaman watch setelah pembayaran berhasil
    res.redirect(`/watch?movieId=${movieId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/paymentsubs', async (req, res) => {
  try {
    const { search } = req.query;
    let searchResults = [];
    let iscomingsoon = false; // Tambahkan variabel iscomingsoon
    let isadmin = false;
    if (search) {
      // Search in all movie models for title matching the search query
      const movieSearchResults = await Promise.all([
        Movie.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie2.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie3.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie4.find({ name: { $regex: search, $options: 'i' } }).exec()
      ]);
      // Flatten and filter out null values
      searchResults = movieSearchResults.flat().filter(result => result !== null);

      // If no search results found, log a message to console
      if (searchResults.length === 0) {
        console.log(`No search results found for query: ${search}`);
      } else {
        // Check if search results are from Movie2
        searchResults.forEach(result => {
          if (result instanceof Movie2) {
            iscomingsoon = true;
          }
        });
      }
    }
        // Check if user is admin based on email
        if (req.user && req.user.email === '111@admin.com') {
          isadmin = true;
        }
      // Pastikan pengguna sudah login dan req.user tidak null
      if (req.isAuthenticated()) {
          // Dapatkan informasi pengguna dari objek req.user yang sudah di-deserialize
          const user = req.user;
          const movieId = req.query.movieId;
          const isLoggedIn = !!req.user;
          const moviesBought = req.user.alrbuy;
          const userSubs = req.user.subs;
              // untuk menghitung sisa hari langganan

          const userId = req.user._id;
          const now = new Date();
          const subEndDate = new Date(user.subsenddate);
          const diffTime = subEndDate - now;
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if(diffDays < 0){
            const diffday = 0;
            diffDays = diffday;
      
          }
          // Render halaman pembayaran dengan menyertakan data uang
          res.render('paymentsubs', { usersubs: user.subs, isLoggedIn, userMoney: user.uang, searchResults, iscomingsoon, moviesBought, userSubs, movieId, isadmin, user, userId, diffDays});
      } else {
          // Jika pengguna belum login, redirect ke halaman login
          res.redirect('/login');
      }
  } catch (error) {
      console.error(error);
      res.render('error'); // Handle errors appropriately
  }
});

  // Rute untuk menangani checkout
app.post('/checkoutsubs', async (req, res) => {
  try {
      const user = req.user;

      // Periksa apakah pengguna memiliki cukup uang untuk membeli subs
      if (user.uang < 50) {
          return res.status(403).send('Insufficient funds');
      }

      // Periksa apakah pengguna sudah pernah membeli subs
      if (user.subs) {
          // Jika sudah, tambahkan 1 bulan ke tanggal subsenddate
          const oneMonthLater = new Date(user.subsenddate);
          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
          user.subsenddate = oneMonthLater;
          // Kurangi uang pengguna dengan harga langganan
          user.uang -= 50;

          // Cari akun admin yang terkait
          const adminUser = await User.findOne({ email: '111@admin.com' });

          // Tambahkan jumlah uang yang sudah dikurangi dari pengguna ke saldo uang admin
          adminUser.uang += 50;

          // Simpan perubahan saldo uang admin ke dalam database
          await adminUser.save();
          // Simpan perubahan pada pengguna ke dalam database
          await user.save();

          // Redirect pengguna ke halaman watch
          return res.redirect('/');
      }

      // Kurangi uang pengguna dengan harga subs
      user.uang -= 50;

      // Ubah user.subs menjadi true
      user.subs = true;

      // Set tanggal checkout ke subsstartdate
      user.subsstartdate = new Date();

      // Hitung tanggal subsenddate satu bulan ke depan
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      user.subsenddate = oneMonthLater;

      // Simpan perubahan pada pengguna ke dalam database
      await user.save();

      // Cari akun admin yang terkait
      const adminUser = await User.findOne({ email: '111@admin.com' });

      // Tambahkan jumlah uang yang sudah dikurangi dari pengguna ke saldo uang admin
      adminUser.uang += 50;

      // Simpan perubahan saldo uang admin ke dalam database
      await adminUser.save();

      const token = generateToken(req.user);
      res.cookie('jwt', token, { httpOnly: true });

      // Redirect pengguna ke halaman watch setelah pembayaran berhasil
      res.redirect('/');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/admin', async (req, res) => {
  try {
    const { search } = req.query;
    let searchResults = [];
    let iscomingsoon = false; // Tambahkan variabel iscomingsoon
    let isadmin = false
    if (search) {
      // Search in all movie models for title matching the search query
      const movieSearchResults = await Promise.all([
        Movie.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie2.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie3.find({ name: { $regex: search, $options: 'i' } }).exec(),
        Movie4.find({ name: { $regex: search, $options: 'i' } }).exec()
      ]);
      // Flatten and filter out null values
      searchResults = movieSearchResults.flat().filter(result => result !== null);

      // If no search results found, log a message to console
      if (searchResults.length === 0) {
        console.log(`No search results found for query: ${search}`);
      } else {
        // Check if search results are from Movie2
        searchResults.forEach(result => {
          if (result instanceof Movie2) {
            iscomingsoon = true;
          }
        });
      }
    }
        // Check if user is admin based on email
        if (req.user && req.user.email === '111@admin.com') {
          isadmin = true;
        }
    if (req.isAuthenticated() && req.user.email === '111@admin.com') {
      // Jika pengguna terautentikasi dan alamat emailnya adalah admin
      const movies1 = await Movie.find();
      const movies2 = await Movie2.find();
      const movies3 = await Movie3.find();
      const movies4 = await Movie4.find();
      const totalMovies = await websiteController.getTotalMovies();
      const totalUsers = await websiteController.getTotalUsers();
      const totalUang = await websiteController.getAdminUang();
      const isLoggedIn = true; // Set isLoggedIn menjadi true karena pengguna terautentikasi
      const moviesBought = req.user.alrbuy;
      const userSubs = req.user.subs;
          // untuk menghitung sisa hari langganan
    const user = req.user;
    const userId = req.user._id;
    const now = new Date();
    const subEndDate = new Date(user.subsenddate);
    const diffTime = subEndDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      res.render('admin', { movies1, movies2, movies3, movies4, totalMovies, totalUsers, totalUang, isLoggedIn, searchResults, iscomingsoon, moviesBought, userSubs, isadmin, user, userId, diffDays }); // Pass movie data to the template
    } else {
      // Jika pengguna tidak terautentikasi atau bukan admin, redirect atau tampilkan pesan akses ditolak
      res.redirect('/login');
    }
  } catch (error) {
    console.error(error);
    res.render('error'); // Handle errors appropriately
  }
});



// Pindahkan rute insertmovie ke movieController
app.post('/insertmovie', movieController.insertMovie);

app.post('/updatemovie', movieController.updatemovie);

// Pindahkan rute upload ke movieController
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('jsonFile'), movieController.uploadJSON);

app.get('/delete/:movieId', movieController.deleteMovie);

app.get('/getmovie/:id', async (req, res) => {
  try {
    const movieId = req.params.id;

    // Jalankan pencarian pada semua model secara paralel
    const [movie1, movie2, movie3, movie4] = await Promise.all([
      Movie.findById(movieId),
      Movie2.findById(movieId),
      Movie3.findById(movieId),
      Movie4.findById(movieId)
    ]);

    // Gabungkan hasil pencarian dari semua model
    const movies = [movie1, movie2, movie3, movie4].filter(movie => movie !== null);

    // Cek apakah ada film yang ditemukan
    if (movies.length > 0) {
      res.json(movies); // Mengembalikan data film dalam format JSON
    } else {
      res.status(404).send('Movie not found'); // Mengembalikan status 404 jika film tidak ditemukan
    }
  } catch (error) {
    res.status(500).send('Error retrieving movie'); // Mengembalikan status 500 jika terjadi kesalahan server
  }
});


// check subs status
checkSubscriptionStatus();
setInterval(checkSubscriptionStatus, 24 * 60 * 60 * 1000);



app.get('/api/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId; // Menggunakan req.params.userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.post('/updateprofile', async (req, res) => {
  try {
    const userId = req.body.userId; // Ambil id pengguna dari formulir

    const { name, password, passwordbaru, passwordconfirm } = req.body; // Ambil data dari formulir

    // Perbarui data pengguna dalam database, termasuk nama
    const updatedUserData = {};
    
    // Cek apakah pengguna mencoba mengubah nama menjadi kosong
    if (!name) {
      // Cari pengguna berdasarkan userId
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('Pengguna tidak ditemukan');
      }
      // Set name sama dengan nama pengguna sebelumnya
      updatedUserData.name = user.name;
      // Tetapkan pesan kesalahan
      req.flash('error', 'Nama tidak boleh kosong');
    } else {
      updatedUserData.name = name;
    }

    // Cek apakah pengguna ingin mengubah password
    if (passwordbaru && passwordconfirm) {
      // Cek apakah pengguna memasukkan password saat ini dengan benar
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('Pengguna tidak ditemukan');
      }

      const isPasswordValid = await user.comparePassword(password); // Metode comparePassword dari model User
      if (!isPasswordValid) {
        req.flash('error', 'Password saat ini salah');
      }

      // Periksa apakah password baru dan konfirmasi password cocok
      if (passwordbaru !== passwordconfirm) {
        req.flash('error', 'Password baru tidak cocok dengan konfirmasi password');
      }

      // Hash password baru sebelum disimpan
      const hashedPassword = await bcrypt.hash(passwordbaru, 10);
      updatedUserData.password = hashedPassword;
    }

    // Perbarui profil pengguna dalam database
    await User.findByIdAndUpdate(userId, updatedUserData);

    res.redirect('/'); // Redirect ke halaman profil setelah berhasil mengupdate profil
  } catch (error) {
    console.error('Error while updating profile:', error);
    res.status(500).send('Terjadi kesalahan saat mengupdate profil');
  }
});




mongoose.connect(mongoURI, {})
  .then(async () => {
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

app.get('/login', ensureAuthenticated, (req, res) => {
    res.render('login');
    });

app.get('/signin' , ensureAuthenticated, (req, res) => {
    res.render('signin');
    });
app.get('/logout', (req, res) => {
    res.render('logout');
    });
app.get('/watch', (req, res) => {
    res.render('watch');
    });
app.get('/admin',  ensureAuthenticated, (req, res) => {
    res.render('admin', { messages: req.flash() });
});
app.get('/payment', (req, res) => {
    res.render('payment');
});
app.get('/paymentsubs', (req, res) => {
  res.render('paymentsubs');
});

// Mulai server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});