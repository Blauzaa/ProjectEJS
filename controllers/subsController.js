// Import model User
const User = require("../models/user");

// Fungsi untuk memeriksa berlangganan pengguna
async function checkSubscriptionStatus() {
    try {
        // Dapatkan semua pengguna yang memiliki subs aktif
        const users = await User.find({ subs: true });

        // Periksa setiap pengguna
        users.forEach(async user => {
            // Periksa apakah tanggal berlangganan sudah lewat
            if (user.subsenddate < new Date()) {
                // Jika sudah lewat, ubah status berlangganan menjadi false
                user.subs = false;
                user.subsstartdate = null; // Atur subsstartdate menjadi null
                user.subsenddate = null; // Atur subsenddate menjadi null
                
                // Simpan perubahan pada pengguna ke dalam database
                await user.save();
            }
        });
    } catch (error) {
        console.error('Error checking subscription status:', error);
    }
}

// Fungsi untuk mengekspor kontroler
module.exports = checkSubscriptionStatus;
