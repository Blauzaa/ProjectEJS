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
  


const insertMovie = async (req, res) => {
  try {
    // Ambil data yang dikirimkan dari form
    const { name, rating, genre, harga, poster, video, quality, releasedate, duration, language, description, posterls, ss1, ss2, ss3, ss4, seasons, category } = req.body;

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

    // Cek apakah data sudah ada di database
    const existingMovie = await movieModel.findOne({ name });

    // Jika data sudah ada, kirimkan pesan bahwa film sudah ada
    if (existingMovie) {
      req.flash("error", "Film sudah ada di database.");
      return res.redirect('/admin'); // Redirect kembali ke halaman admin
    } else {
      // Buat objek film baru dan simpan ke dalam database
      const newMovie = new movieModel({
        name,
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
        seasons: seasons.split(',').map(Number)
      });

      await newMovie.save();
      
      // Kirimkan respons bahwa film berhasil ditambahkan
      req.flash("success", "Film berhasil ditambahkan.");
      res.redirect('/admin'); // Redirect ke halaman admin setelah menambahkan film
    }

  } catch (error) {
    req.flash("error", "Error inserting movie: " + error.message); // Sertakan pesan kesalahan dalam pesan flash
    res.redirect('/admin'); // Redirect ke halaman admin jika terjadi kesalahan
  }
};


const uploadJSON = async (req, res) => {
  const { category } = req.body;
  const filePath = req.file.path;

  try {
      // Baca data dari file JSON yang diunggah
      const data = fs.readFileSync(filePath, 'utf8');

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
      for (const movieData of movies) {
          // Check if the movie already exists in the database
          const existingMovie = await movieModel.findOne({ name: movieData.name });

          // If the movie already exists, skip to the next movie
          if (existingMovie) {
              console.log(`Film '${movieData.name}' already exists in the database. Skipping...`);
              continue;
          }

          // Create a new movie object and save it to the database
          const newMovie = new movieModel(movieData);
          await newMovie.save();
      }

      // Kirimkan respons bahwa film berhasil ditambahkan
      req.flash("succes", "File JSON berhasil diunggah dan data disimpan.");
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
    const { id, name, rating, genre, harga, poster, video, quality, releasedate, duration, language, description, posterls, ss1, ss2, ss3, ss4, seasons } = req.body;

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
      seasons: seasons.split(',').map(Number)
    });

    req.flash("success", "Film berhasil diperbarui.");
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating movie: " + error.message);
    res.redirect('/admin');
  }
};





// Fungsi untuk membuat film baru dalam koleksi yang ditentukan berdasarkan data dari file JSON
// async function createMovies(movies, collectionName) {
//   const MovieModel = collectionName === '1' ? Movie : collectionName === '2' ? Movie2 : collectionName === '3' ? Movie3 : Movie4;
//   try {
//       const existingMovies = await MovieModel.find(); // Get all existing movies in the collection

//       for (const existingMovie of existingMovies) {
//           const found = movies.find(movie => movie.name === existingMovie.name);
//           if (!found) {
//               // Movie exists in the database but not in the JSON file, so it should be removed from the database
//               await MovieModel.deleteOne({ _id: existingMovie._id });
//               console.log(`Movie "${existingMovie.name}" deleted from collection "${collectionName}" because it's not in the JSON file.`);
//           }
//       }

//       for (const movie of movies) {
//           const existingMovie = await MovieModel.findOne({ name: movie.name });

//           if (!existingMovie) {
//               const newMovie = new MovieModel(movie);
//               await newMovie.save();
//               console.log(`Movie "${movie.name}" added to collection "${collectionName}" successfully.`);
//           } else {
//               let shouldUpdate = false;

//               // Check for differences in all properties
//               for (const key in existingMovie._doc) {
//                   if (existingMovie._doc.hasOwnProperty(key) && key !== '_id' && key !== '__v') {
//                       if (existingMovie[key] !== movie[key]) {
//                           existingMovie[key] = movie[key];
//                           shouldUpdate = true;
//                       }
//                   }
//               }

//               if (shouldUpdate) {
//                   await existingMovie.save();
//                   console.log(`Movie "${movie.name}" updated in collection "${collectionName}".`);
//               } else {
//                   console.log(`Movie "${movie.name}" already exists in collection "${collectionName}". Skipping.`);
//               }
//           }
//       }
//   } catch (error) {
//       console.error("Error creating or updating movies:", error);
//   }
// }
  
// Membaca data film dari file JSON dan menambahkannya ke koleksi yang sesuai dalam database
  // fs.promises.readFile(movieFile1, 'utf-8')
  //   .then(data => {
  //     const movies = JSON.parse(data);
  //     createMovies(movies, '1'); // Add movies to collection 1
  //   })
  //   .catch(error => console.error('Error reading ontrending.json:', error));
  
  // fs.promises.readFile(movieFile2, 'utf-8')
  //   .then(data => {
  //     const movies = JSON.parse(data);
  //     createMovies(movies, '2'); // Add movies to collection 2
  //   })
  //   .catch(error => console.error('Error reading movie-data2.json:', error));
  
  // fs.promises.readFile(movieFile3, 'utf-8')
  //   .then(data => {
  //     const movies = JSON.parse(data);
  //     createMovies(movies, '3'); // Add movies to collection 3
  //   })
  //   .catch(error => console.error('Error reading movie-data3.json:', error));
      
  // fs.promises.readFile(movieFile4, 'utf-8')
  // .then(data => {
  //   const movies = JSON.parse(data);
  //   createMovies(movies, '4'); // Add movies to collection 4
  // })
  // .catch(error => console.error('Error reading movie-data4.json:', error));

  // Ekspor semua fungsi agar bisa digunakan di file lain dalam aplikasi
module.exports = { getMovies, getComingSoonMovies, getFreeMovies, getMainMovies, insertMovie, uploadJSON, deleteMovie, updatemovie};
