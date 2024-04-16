// models/Movie.js
const mongoose = require('mongoose'); // Import library Mongoose
// Definisikan schema untuk model Movie
const movieSchema = new mongoose.Schema({
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
  trailer: String,
});
// Buat model Movie berdasarkan schema yang telah didefinisikan
const Movie = mongoose.model('Movie', movieSchema); 
const Movie2 = mongoose.model('Movie2', movieSchema); // Buat model lain jika diperlukan
const Movie3 = mongoose.model('Movie3', movieSchema); // Buat model lain jika diperlukan
const Movie4 = mongoose.model('Movie4', movieSchema); // Buat model lain jika diperlukan

// Ekspor model Movie agar dapat digunakan di file lain
module.exports = { Movie, Movie2, Movie3, Movie4 };
