const LocalStrategy = require("passport-local").Strategy; // Mengimpor modul LocalStrategy dari passport-local
const bcrypt = require("bcrypt"); // Mengimpor modul bcrypt untuk melakukan hashing password

async function initialize(passport, getUserByEmail, getUserById) { 
  
  async function authenticateUsers(email, password, done){ 
    try { 
      const user = await getUserByEmail(email); 
      
      if (!user) { 
        return done(null, false, { message: "Tidak ada pengguna ditemukan dengan email tersebut" });
      }

      const salt = await bcrypt.genSalt(10); // Menghasilkan salt untuk penguncian password dengan panjang 10

      const hashedPassword = await bcrypt.hash(password, salt); // Melakukan hashing terhadap password yang dimasukkan menggunakan salt yang dihasilkan

      const isMatch = await bcrypt.compare(password, user.password); 
      
      if (isMatch) { 
        return done(null, user);
      } else { 
        return done(null, false, { message: "Password Salah" });
      }
    } catch (err) { 
      console.error("Error saat melakukan autentikasi:", err); 
      return done(err); 
    }  
  };

  // Menggunakan strategi autentikasi lokal (LocalStrategy) dengan menggunakan email sebagai username field
  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUsers)); 

  // Meng-serialize user menjadi ID
  passport.serializeUser((user, done) => done(null, user.id)); 

  // Meng-deserialize user berdasarkan ID
  passport.deserializeUser((id, done) => { 
    try { 
      const user = getUserById(id);
      done(null, user); 
    } catch (err) { 
      console.error("Error saat melakukan deserialisasi pengguna:", err); 
      done(err); 
    }
  });
}

module.exports = initialize;
