// Import library Mongoose
const mongoose = require('mongoose');

// Definisikan schema untuk model User
const userSchema = new mongoose.Schema({
  name: String,     
  email: String,    
  password: String,
  uang: { type: Number, default: 0 }, // Set default value untuk uang
  alrbuy: { type: [String], default: [] }
});

// Buat model User berdasarkan schema yang telah didefinisikan
const User = mongoose.model('User', userSchema);


// Ekspor model User agar dapat digunakan di file lain
module.exports = User;
