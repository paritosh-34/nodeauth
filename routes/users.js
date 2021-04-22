const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("../models/User");

router.post("/register", async (req, res) => {
  const { username, password, email, phone } = req.body;

  let errors = [];

  if (!username || !email || !password || !phone) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (phone.length !== 10) {
    errors.push({ msg: "Phone must be 10 digits" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    return res.render("signup", {
      layout: "layouts/login",
      errors,
      username,
      email,
      password,
      phone,
    });
  } else {
    try {
      const r1 = await User.findOne({ username: username });
      const r2 = await User.findOne({ phone: phone });
      const r3 = await User.findOne({ email: email });

      if (r1 || r2 || r3) {
        errors.push({ msg: "User already exists" });
        return res.render("signup", {
          layout: "layouts/login",
          errors,
          username,
          email,
          password,
          phone,
        });
      } else {
        const newUser = new User({
          username,
          email,
          password,
          phone,
        });

        // Hash Password
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, async (err, hash) => {
            if (err) throw err;
            
            newUser.password = hash;
            await newUser.save();

            req.flash("success_msg", "You are now registered and can log in");
            return res.redirect("/login");
          });
        });
      }
    } catch (e) {
      console.log("Errer in register:", e);

      errors.push({ msg: "Something went wrong" });
      return res.render("signup", {
        layout: "layouts/login",
        errors,
        username,
        email,
        password,
        phone,
      });
    }
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  return res.redirect('/login');
});


module.exports = router;
