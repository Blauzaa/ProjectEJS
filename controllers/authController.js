const bcrypt = require("bcrypt");
const User = require("../models/user");

// Fungsi untuk mendaftarkan pengguna baru
async function signUp(req, res) {
  try {
    // Memeriksa format email menggunakan regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      req.flash("error", "Invalid email format");
      return res.redirect("/signin");
    }

    // Memeriksa apakah pengguna dengan email atau nama yang sama sudah ada
    const existingUser = await User.findOne({ $or: [{ email: req.body.email }, { name: req.body.name }] });
    if (existingUser) {
      if (existingUser.email === req.body.email) {
        req.flash("error", "Email already exists");
      } else if (existingUser.name === req.body.name) {
        req.flash("error", "Name already exists");
      }
      return res.redirect("/signin");
    } else {
      // Meng-hash password sebelum menyimpannya dalam database
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // Membuat objek pengguna baru berdasarkan data yang diterima dari permintaan
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      });

      // Menyimpan pengguna baru ke dalam database
      await newUser.save();
      console.log(newUser);
      res.redirect("/login"); // Mengarahkan pengguna ke halaman login setelah berhasil mendaftar
    }
  } catch (error) {
    console.error(error);
    res.redirect("/signin"); // Mengarahkan pengguna ke halaman pendaftaran jika terjadi kesalahan
  }
}

// Mengekspor fungsi signUp agar bisa digunakan di file lain dalam aplikasi
module.exports = { signUp };
