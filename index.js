if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); // Menggunakan dotenv untuk mengatur environment variables dalam mode development
}

const express = require('express');
const app = express();
const bcrypt = require("bcrypt"); // Menggunakan bcrypt untuk hashing password
const passport = require("passport"); // Menggunakan Passport.js untuk otentikasi pengguna
const initializePassport = require("./passport/passport-config"); // Menggunakan konfigurasi Passport.js yang telah dibuat
const flash = require("express-flash"); // Menggunakan express-flash untuk mengelola pesan flash
const session = require("express-session"); // Menggunakan express-session untuk manajemen session
const mongoose = require('mongoose'); // Menggunakan Mongoose untuk berinteraksi dengan MongoDB
const fs = require('fs'); // Menggunakan fs untuk membaca file
const moviesDir = './MovieData'; // Direktori yang berisi file JSON data film
const movieFile1 = `${moviesDir}/ontrending.json`; // Path menuju file JSON data film
const movieFile2 = `${moviesDir}/comingsoon.json`; // Path menuju file JSON data film
const movieFile3 = `${moviesDir}/freemovie.json`; // Path menuju file JSON data film
const movieFile4 = `${moviesDir}/mainmovie.json`; // Path menuju file JSON data film
const port = 3000;

  
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Database'; // Mendapatkan URI MongoDB dari environment variable atau default jika tidak ada
const userSchema = new mongoose.Schema({ // Mendefinisikan skema pengguna
  name: String,
  email: String,
  password: String
});
const User = mongoose.model('User', userSchema); // Membuat model pengguna dari skema

const movieSchema = new mongoose.Schema({ // Mendefinisikan skema film
  name: String,
  rating: Number,
  genre: String,
  harga: Number, 
  poster: String, 
  video: String,  
  quality: String,
  releasedate: String,
  duration: String,
  language: String,
  description: String,
  posterls: String,
  ss1: String,
  ss2: String,
  ss3: String,
  ss4: String,
  seasons: [Number],
});
  const Movie = mongoose.model('Movie', movieSchema); 
  const Movie2 = mongoose.model('Movie2', movieSchema);
  const Movie3 = mongoose.model('Movie3', movieSchema);
  const Movie4 = mongoose.model('Movie4', movieSchema);


  async function getMovies() {// Mendapatkan semua film dari koleksi Movie
    try {
      const movies = await Movie.find(); // Get all movies from Movie collection
      return movies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  
  async function getComingSoonMovies() { // Mendapatkan semua film yang akan datang dari koleksi Movie2
    try {
      const comingSoonMovies = await Movie2.find(); // Get all movies from Movie2 collection
      return comingSoonMovies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  
  async function getFreeMovies() { // Mendapatkan semua film gratis dari koleksi Movie3
    try {
      const freeMovies = await Movie3.find({ harga: 0 }); // Filter Movie3 for "free" movies (harga = 0)
      return freeMovies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async function getMainMovies() { // Mendapatkan semua film utama dari koleksi Movie4
    try {
      const mainMovies = await Movie4.find(); // Get all movies from Movie4 collection
      return mainMovies;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  
  async function createMovies(movies, collectionName) {  // Membuat film baru dalam koleksi yang ditentukan
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
  
// Membaca data film dari file JSON dan menambahkannya ke koleksi yang sesuai dalam database
  fs.promises.readFile(movieFile1, 'utf-8')
    .then(data => {
      const movies = JSON.parse(data);
      createMovies(movies, '1'); // Add movies to collection 1
    })
    .catch(error => console.error('Error reading ontrending.json:', error));
  
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

  
  mongoose.connect(mongoURI, { }) // Menghubungkan ke MongoDB menggunakan URI yang ditentukan
  .then(() => { // Mengonfirmasi koneksi berhasil
    console.log('MongoDB connected successfully.');
  })
  .catch(err => console.error('MongoDB connection error:', err)); // Menangani kesalahan koneksi MongoDB




  
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

  
  app.post("/signin", async (req, res) => {
    try {
        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            req.flash("error", "Invalid email format");
            return res.redirect("/signin");
        }
        // Cek apakah pengguna dengan email atau nama yang sama sudah ada
        const existingUser = await User.findOne({ $or: [{ email: req.body.email }, { name: req.body.name }] });
        if (existingUser) {
            if (existingUser.email === req.body.email) {
                req.flash("error", "Email already exists");
            } else if (existingUser.name === req.body.name) {
                req.flash("error", "Name already exists");
            }
            return res.redirect("/signin");
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10); // Hash password menggunakan bcrypt
    
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword, // Menyimpan password yang telah di-hash
            });
    
            await newUser.save(); // Menyimpan pengguna baru ke dalam database
            console.log(newUser); // Menampilkan informasi pengguna baru di console
            res.redirect("/login"); // Redirect ke halaman login setelah berhasil mendaftar
        }
    } catch (e) {
        console.log(e);
        res.redirect("/signin");
    }
});



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