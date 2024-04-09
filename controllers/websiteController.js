// Import model-model yang diperlukan
const { Movie, Movie2, Movie3, Movie4 } = require("../models/movie");
const User = require("../models/user"); // Sesuaikan dengan model user Anda

// Fungsi untuk menghitung total film dari semua model
async function getTotalMovies() {
    try {
        // Mengambil jumlah film dari setiap model
        const totalMovies1 = await Movie.countDocuments();
        const totalMovies2 = await Movie2.countDocuments();
        const totalMovies3 = await Movie3.countDocuments();
        const totalMovies4 = await Movie4.countDocuments();

        // Menghitung total keseluruhan film
        const totalMovies = totalMovies1 + totalMovies2 + totalMovies3 + totalMovies4;

        return totalMovies;
    } catch (error) {
        console.error('Error while fetching total movies:', error);
        throw error;
    }
}

// Fungsi untuk menghitung total pengguna
async function getTotalUsers() {
    try {
        // Mengambil jumlah pengguna dari koleksi user, namun tidak menghitung pengguna dengan nama "admin" dan email "111@admin.com"
        const totalUsers = await User.countDocuments({ $and: [{ name: { $ne: "admin" } }, { email: { $ne: "111@admin.com" } }] });

        return totalUsers;
    } catch (error) {
        console.error('Error while fetching total users:', error);
        throw error;
    }
}


// Fungsi untuk mengambil nilai uang dari user dengan nama "admin" dan email "111@admin.com"
async function getAdminUang() {
    try {
        // Cari user dengan nama "admin" dan email "111@admin.com"
        const adminUser = await User.findOne({ name: "admin", email: "111@admin.com" });

        // Jika user ditemukan, kembalikan nilai uang
        if (adminUser) {
            return adminUser.uang;
        } else {
            // Jika user tidak ditemukan, kembalikan null atau nilai default yang sesuai
            return null; // atau return 0; jika Anda ingin mengembalikan 0 jika user tidak ditemukan
        }
    } catch (error) {
        console.error('Error while fetching admin uang:', error);
        throw error;
    }
}

// Ekspor fungsi agar dapat digunakan di file lain
module.exports = {
    getTotalMovies,
    getTotalUsers,
    getAdminUang
};

