// controllers/movieController.js

const { Movie, Movie2, Movie3, Movie4 } = require("../models/movie"); // Import all necessary models
const fs = require('fs');
const mongoose = require('mongoose');
// const moviesDir = './MovieData'; // Direktori yang berisi file JSON data film
// const movieFile1 = `${moviesDir}/ontrending.json`; // Path menuju file JSON data film
// const movieFile2 = `${moviesDir}/comingsoon.json`; // Path menuju file JSON data film
// const movieFile3 = `${moviesDir}/freemovie.json`; // Path menuju file JSON data film
// const movieFile4 = `${moviesDir}/mainmovie.json`; // Path menuju file JSON data film
const multer = require('multer');
const flash = require("express-flash");
const axios = require('axios');

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
  
// Fungsi untuk mendapatkan trailer dari TMDB API berdasarkan judul drama Korea
async function getMovieDetailsFromOMDb(title, year) { // Menambahkan parameter 'year'
  try {
    const apiKey = process.env.OMDB_API_KEY; // Ambil kunci API OMDb dari variabel lingkungan

    // Buat URL pencarian OMDb berdasarkan judul film dan tahun
    const searchUrl = `http://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}&y=${year}`;

    // Lakukan permintaan HTTP ke URL pencarian
    const searchResponse = await axios.get(searchUrl);

    // Periksa apakah pencarian berhasil
    if (searchResponse.data.Response !== 'True') {
      console.error(`OMDb search failed for title: ${title}`);
      return null; // Tidak ada trailer yang ditemukan
    }

    // Ekstrak IMDb ID dari respons pencarian
    const imdbID = searchResponse.data.imdbID;

    // Ubah IMDb ID menjadi URL trailer IMDb
    const trailerUrl = imdbIdToTrailerUrl(imdbID);

    // Ekstrak informasi tambahan dari respons pencarian
    const movieDetails = {
      released: searchResponse.data.Released,
      runtime: searchResponse.data.Runtime,
      genre: searchResponse.data.Genre,
      plot: searchResponse.data.Plot,
      language: searchResponse.data.Language,
      poster: searchResponse.data.Poster,
      imdbrating: searchResponse.data.imdbRating
    };

    // Kembalikan trailer URL dan informasi tambahan
    return { trailerUrl, ...movieDetails };
  } catch (error) {
    console.error('Error getting trailer and movie details from OMDb:', error);
    return null; // Tangani kesalahan dengan tepat
  }
}

// Fungsi untuk mengonversi IMDb ID menjadi URL trailer IMDb
function imdbIdToTrailerUrl(imdbId) {
  const baseUrl = 'https://www.imdb.com/title';
  const trailerUrl = `${baseUrl}/${imdbId}/`;
  return trailerUrl;
}

// Fungsi untuk menyisipkan film baru ke dalam database
const insertMovie = async (req, res) => {
  try {
    const { name, tahun, rating, genre, harga, poster, video, quality, releasedate, duration, language, description, posterls, ss1, ss2, ss3, ss4, seasons, category } = req.body;

    // Ambil trailer dari OMDb
    const movieDetails = await getMovieDetailsFromOMDb(name, tahun);

    // Tentukan model yang akan digunakan berdasarkan kategori
    let movieModel;
    switch (category) {
      case '1':
        movieModel = Movie;
        break;
      case '2':
        movieModel = Movie2;
        break;
      case '3':
        movieModel = Movie3;
        break;
      case '4':
        movieModel = Movie4;
        break;
      default:
        throw new Error('Invalid category');
    }

    // Buat objek film baru dengan trailer
    const newMovie = new movieModel({
      name,
      tahun,
      rating: movieDetails.imdbrating,
      genre: movieDetails.genre,
      harga,
      poster: movieDetails.poster,
      video,
      quality,
      releasedate: movieDetails.released,
      duration: movieDetails.runtime,
      language: movieDetails.language,
      description: movieDetails.plot,
      posterls,
      ss1,
      ss2,
      ss3,
      ss4,
      seasons: seasons.split(',').map(Number),
      trailer: movieDetails.trailerUrl, // Simpan URL trailer dari OMDb
    });

    // Simpan film ke database
    await newMovie.save();

    // Kirimkan respons bahwa film berhasil ditambahkan
    req.flash("success", "Film berhasil ditambahkan.");
    res.redirect('/admin'); // Redirect ke halaman admin setelah menambahkan film
  } catch (error) {
    console.error(error);
    req.flash("error", "Error inserting movie: " + error.message); // Sertakan pesan kesalahan dalam pesan flash
    res.redirect('/admin'); // Redirect ke halaman admin jika terjadi kesalahan
  }
};

// Fungsi untuk mengunggah data film dari file JSON ke dalam database
// Loop through each movie entry from the JSON file
const uploadJSON = async (req, res) => {
  const { category } = req.body;
  const filePath = req.file.path;

  try {
    // Baca data dari file JSON yang diunggah
    const data = fs.readFileSync(filePath, 'utf8');
    fs.unlinkSync(filePath);
    // Parse data JSON
    const movies = JSON.parse(data);

    // Tentukan model yang akan digunakan berdasarkan kategori
    let movieModel;
    switch (category) {
      case '1':
        movieModel = Movie;
        break;
      case '2':
        movieModel = Movie2;
        break;
      case '3':
        movieModel = Movie3;
        break;
      case '4':
        movieModel = Movie4;
        break;
      default:
        throw new Error('Invalid category');
    }

    // Loop through each movie entry from the JSON file
    // Loop through each movie entry from the JSON file
for (const movieData of movies) {
  // Check if the movie already exists in the database
  const existingMovie = await movieModel.findOne({ name: movieData.name });

  // If the movie already exists, skip to the next movie
  if (existingMovie) {
    console.log(`Film '${movieData.name}' already exists in the database. Skipping...`);
    continue;
  }

  // Ambil trailer dan informasi film dari OMDb
  const movieDetails = await getMovieDetailsFromOMDb(movieData.name, movieData.tahun);

  // Tambahkan informasi film ke data film sebelum menyimpannya ke database
  const newMovieData = {
    name: movieData.name,
    tahun: movieData.tahun,
    rating: movieDetails.imdbrating,
    genre: movieDetails.genre,
    harga: movieData.harga,
    poster: movieDetails.poster,
    video: movieData.video,
    quality: movieData.quality,
    releasedate: movieDetails.released,
    duration: movieDetails.runtime,
    language: movieDetails.language,
    description: movieDetails.plot,
    posterls: movieData.posterls,
    ss1: movieData.ss1,
    ss2: movieData.ss2,
    ss3: movieData.ss3,
    ss4: movieData.ss4,
    seasons: movieData.seasons,
    trailer: movieDetails.trailerUrl,
  };

  // Create a new movie object and save it to the database
  const newMovie = new movieModel(newMovieData);
  await newMovie.save();
}

    // Kirimkan respons bahwa film berhasil ditambahkan
    req.flash("success", "File JSON berhasil diunggah dan data disimpan.");
    res.redirect('/admin'); // Redirect ke halaman admin setelah menambahkan data
  } catch (error) {
    req.flash("errors", "Error uploading JSON file: " + error.message); // Sertakan pesan kesalahan dalam pesan flash
    res.redirect('/admin'); // Redirect ke halaman admin jika terjadi kesalahan
  }
};


// Function to delete a movie
const deleteMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Check if the movieId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      req.flash("error", "Invalid movie ID.");
      return res.redirect('/admin');
    }

    // Iterate through movie models to find and delete the movie
    const movieModels = [Movie, Movie2, Movie3, Movie4];
    let movieDeleted = false;
    for (const movieModel of movieModels) {
      const deletedMovie = await movieModel.findByIdAndDelete(movieId);
      if (deletedMovie) {
        movieDeleted = true;
        break; // Exit loop if movie is found and deleted
      }
    }

    // Check if the movie was found and deleted
    if (movieDeleted) {
      req.flash("success", "Film berhasil dihapus.");
    } else {
      req.flash("error", "Film tidak ditemukan.");
    }
    res.redirect('/admin');
  } catch (error) {
    req.flash("error", "Error deleting movie: " + error.message);
    res.redirect('/admin');
  }
};



const updatemovie = async (req, res) => {
  try {
    const { id, name, tahun, rating, genre, harga, poster, video, quality, releasedate, duration, language, description, posterls, ss1, ss2, ss3, ss4, seasons, trailer } = req.body;

    // Cari film berdasarkan ID
    let movieModel;
    let movieData;
    movieData = await Movie.findById(id);
    if (movieData) {
      movieModel = Movie;
    } else {
      movieData = await Movie2.findById(id);
      if (movieData) {
        movieModel = Movie2;
      } else {
        movieData = await Movie3.findById(id);
        if (movieData) {
          movieModel = Movie3;
        } else {
          movieData = await Movie4.findById(id);
          if (movieData) {
            movieModel = Movie4;
          } else {
            req.flash("error", "Film tidak ditemukan.");
            return res.redirect('/admin');
          }
        }
      }
    }

    // Update data film
    await movieModel.findByIdAndUpdate(id, {
      name,
      tahun,
      rating,
      genre,
      harga,
      poster,
      video,
      quality,
      releasedate,
      duration,
      language,
      description,
      posterls,
      ss1,
      ss2,
      ss3,
      ss4,
      seasons: seasons.split(',').map(Number),
      trailer
    });

    req.flash("success", "Film berhasil diperbarui.");
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating movie: " + error.message);
    res.redirect('/admin');
  }
};

  // Ekspor semua fungsi agar bisa digunakan di file lain dalam aplikasi
module.exports = { getMovies, getComingSoonMovies, getFreeMovies, getMainMovies, insertMovie, uploadJSON, deleteMovie, updatemovie};
