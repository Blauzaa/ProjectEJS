// controllers/movieController.js

const { Movie, Movie2, Movie3, Movie4 } = require("../models/movie"); // Import all necessary models
const fs = require('fs');
const mongoose = require('mongoose');
const moviesDir = './MovieData'; // Direktori yang berisi file JSON data film
const movieFile1 = `${moviesDir}/ontrending.json`; // Path menuju file JSON data film
const movieFile2 = `${moviesDir}/comingsoon.json`; // Path menuju file JSON data film
const movieFile3 = `${moviesDir}/freemovie.json`; // Path menuju file JSON data film
const movieFile4 = `${moviesDir}/mainmovie.json`; // Path menuju file JSON data film

// Fungsi untuk mendapatkan semua film dari koleksi Movie
async function getMovies(mongoURI) {
  try {
    const movies = await Movie.find();
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
  
// Fungsi untuk membuat film baru dalam koleksi yang ditentukan berdasarkan data dari file JSON
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

  // Ekspor semua fungsi agar bisa digunakan di file lain dalam aplikasi
module.exports = { getMovies, getComingSoonMovies, getFreeMovies, getMainMovies};
