// Import library Mongoose
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Definisikan schema untuk model User
const userSchema = new mongoose.Schema({
  name: String,     
  email: String,    
  password: String,
  uang: { type: Number, default: 0 }, // Set default value untuk uang
  alrbuy: { type: [String], default: [] },
  subs: {type: Boolean, default: false},
  subsstartdate: {type: Date, default: null},
  subsenddate: {type: Date, default: null}
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Buat model User berdasarkan schema yang telah didefinisikan
const User = mongoose.model('User', userSchema);


// Ekspor model User agar dapat digunakan di file lain
module.exports = User;
