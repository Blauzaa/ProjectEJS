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
const movieController = require('./controllers/movieController');
const bodyParser = require('body-parser');
const multer = require('multer');
const websiteController = require('./controllers/websiteController');

app.use(bodyParser.urlencoded({ extended: true }));

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
  failureRedirect: "/login", // Redirect ke halaman login jika gagal
  failureFlash: true // Menggunakan pesan flash untuk informasi kegagalan
}), (req, res) => {
  // Setelah berhasil login, arahkan ke halaman yang sesuai berdasarkan peran pengguna (admin atau bukan)
  if (req.user.admin) {
    res.redirect("/admin");
  } else {
    res.redirect("/");
  }
});





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
    const user = req.user;
    const moviesBought = user ? user.alrbuy : [];
    res.render('index', { movies, comingSoon, freeMovies, mainMovies, isLoggedIn, moviesBought }); // Pass movie data to the template
  } catch (error) {
    console.error(error);
    res.render('error'); // Handle errors appropriately
  }
});
// Rute untuk menampilkan detail film di halaman watch
app.get('/watch', async (req, res) => {
  try {
    const movieId = req.query.movieId; // Mengambil ID film dari parameter query
    
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
    
    const isLoggedIn = !!req.user; // Check if user is logged in
    res.render('watch', { selectedMovie: foundMovie, isLoggedIn }); // Pass movie data to the template
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


  app.get('/payment', async (req, res) => {
    try {
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

            // Dapatkan data film dari database
            const selectedMovie = await Movie.findById(movieId);

            // Render halaman pembayaran dengan menyertakan data uang
            res.render('payment', { selectedMovie, isLoggedIn: true, userMoney: user.uang });
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
// Rute untuk menangani checkout
app.post('/checkout', async (req, res) => {
  try {
    const movieId = req.query.movieId; // Mengambil ID film dari parameter query
    const selectedMovie = await Movie.findById(movieId); // Mengambil data film dari database

    if (!selectedMovie) {
      return res.status(404).send('Movie not found');
    }

    // Dapatkan informasi pengguna dari objek req.user yang sudah di-deserialize
    const user = req.user;

    // Periksa apakah pengguna memiliki cukup uang untuk membeli film
    if (user.uang < selectedMovie.harga) {
      return res.status(403).send('Insufficient funds');
    }

    // Periksa apakah pengguna sudah memiliki film tersebut
    if (user.alrbuy.includes(movieId)) {
      // Jika sudah, langsung arahkan ke halaman watch
      res.redirect(`/watch?movieId=${movieId}`);
      return;
    }

    // Kurangi uang pengguna dengan harga film
    user.uang -= selectedMovie.harga;

    // Tambahkan ID film yang sudah dibeli ke dalam array alrbuy pengguna
    user.alrbuy.push(movieId);

    // Simpan perubahan pada pengguna ke dalam database
    await user.save();

    // Cari akun admin yang terkait
    const adminUser = await User.findOne({ email: '111@admin.com' });

    // Tambahkan jumlah uang yang sudah dikurangi dari pengguna ke saldo uang admin
    adminUser.uang += selectedMovie.harga;

    // Simpan perubahan saldo uang admin ke dalam database
    await adminUser.save();

    // Redirect pengguna ke halaman watch setelah pembayaran berhasil
    res.redirect(`/watch?movieId=${movieId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


  app.get('/admin', async (req, res) => {
    try {
      const movies1 = await Movie.find();
      const movies2 = await Movie2.find();
      const movies3 = await Movie3.find();
      const movies4 = await Movie4.find();
      const totalMovies = await websiteController.getTotalMovies();
      const totalUsers = await websiteController.getTotalUsers();
      const totalUang = await websiteController.getAdminUang();
      res.render('admin', { movies1, movies2, movies3, movies4, totalMovies, totalUsers, totalUang }); // Pass movie data to the template
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
app.get('/admin', (req, res) => {
    res.render('admin', { messages: req.flash() });
});
app.get('/payment', (req, res) => {
    res.render('payment');
});

    // Mulai server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });