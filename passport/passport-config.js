const LocalStrategy = require("passport-local").Strategy; // Mengimpor modul LocalStrategy dari passport-local
const bcrypt = require("bcrypt"); // Mengimpor modul bcrypt untuk melakukan hashing password
const User = require("../models/user");
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(user.toObject(), process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h' // Atur waktu kedaluwarsa token sesuai kebutuhan
  });
}



async function initialize(passport, getUserByEmail, getUserById) { 
  async function authenticateUsers(email, password, done) { 
    try { 
      const user = await getUserByEmail(email); 
      
      if (!user) { 
        return done(null, false, { message: "Email not found." });  //return done digunakan untuk memberi tahu Passport-config.js tentang hasil autentikasi. Fungsi done adalah sebuah callback yang harus dipanggil setelah selesai memproses autentikasi.
      }

      if (email === '111@admin.com' && password === '11111') {
        // Jika sesuai, tandai pengguna sebagai admin
        user.admin = true;
      }

      const salt = await bcrypt.genSalt(10); // Menghasilkan salt untuk penguncian password dengan panjang 10

      const hashedPassword = await bcrypt.hash(password, salt); // Melakukan hashing terhadap password yang dimasukkan menggunakan salt yang dihasilkan

      const isMatch = await bcrypt.compare(password, user.password); 
      
      if (isMatch) {
        
        
        if (user.admin) {
          return done(null, user, { admin: true });
        } else {
          return done(null, user);
        }
      } else {
        return done(null, false, { message: "Wrong Password" });
      }
    } catch (err) {
      console.error("Error during authentication:", err);
      return done(err);
    }
  }

  async function createInitialUser() {
    try {
      const existingUser = await User.findOne({ email: '111@admin.com' });
      if (!existingUser) {
        const password = '11111';
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          name: 'admin',
          email: '111@admin.com',
          password: hashedPassword,
          uang: 0,
          alrbuy: [],
          subs: false,
          subsstartdate: null,
          subsenddate: null,
        });
        await newUser.save();
        console.log('Admin Account added successfully.');
      } else {
        console.log('Admin Account already exists.');
      }
    } catch (error) {
      console.error('Error adding initial user:', error);
    }
  }

  createInitialUser();

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUsers)); 

  passport.serializeUser((user, done) => done(null, user.id)); 

  passport.deserializeUser(async (id, done) => { 
    try { 
      const user = await getUserById(id); // Wait for getUserById to complete
      done(null, user); 
    } catch (err) { 
      console.error("Error during user deserialization:", err); 
      done(err); 
    }
  });
}
function ensureAuthenticated(req, res, next) {
  // Periksa apakah pengguna sudah login
  if (req.isAuthenticated()) {
    // Periksa apakah pengguna adalah admin
    if (req.user.email === '111@admin.com') {
      // Jika pengguna adalah admin, lanjutkan ke rute berikutnya
      return next();
    } else {
      // Jika pengguna bukan admin, alihkan ke halaman tertentu
      return res.redirect('/'); // Ganti '/' dengan halaman yang sesuai
    }
  } else {
    // Jika pengguna belum login, lanjutkan ke rute berikutnya (halaman login)
    return next();
  }
}

function verifyToken(req, res, next) {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect('/login');
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        // Token expired, clear cookie and render login page
        res.clearCookie('jwt'); 
        return res.render('login');
      } else {
        return res.status(500).send('Internal Server Error');
      }
    }

    try {
      const user = await User.findById(decoded._id); // Cari pengguna berdasarkan ID dari token

      if (!user) {
        // Jika pengguna tidak ditemukan, clear cookie dan redirect ke halaman login
        res.clearCookie('jwt'); 
        return res.redirect('/login');
      }

      // Jika pengguna ditemukan, update req.user dengan data pengguna yang valid
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
}





module.exports = {initialize, ensureAuthenticated, verifyToken, generateToken};
