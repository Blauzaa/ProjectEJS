const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

async function initialize(passport, getUserByEmail, getUserById) {
  // Function to authenticate users
  async function authenticateUsers(email, password, done){
    try {
      // Get user by email
      const user = await getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: "No user found with that email" });
      }

      // Generate a salt for password hashing
      const salt = await bcrypt.genSalt(10);

      // Hash the entered password using the salt
      const hashedPassword = await bcrypt.hash(password, salt);

      // Compare the hashed password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password); // Compare entered password with hashed password
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Password Incorrect" });
      }
    } catch (err) {
      console.error("Error during authentication:", err);
      return done(err);
    }  
};

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUsers));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    try {
      const user = getUserById(id);
      done(null, user); 
    } catch (err) {
      console.error("Error during user deserialization:", err);
      done(err); // Pass the error to Passport
    }
  });
}

module.exports = initialize;
