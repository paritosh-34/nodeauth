const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");

const Contact = require("../models/Contact");

router.get("/", (req, res) => {
  return res.redirect("/login");
});

router.get("/login", forwardAuthenticated, (req, res) => {
  return res.render("login", {
    layout: "layouts/login",
  });
});

router.get("/signup", forwardAuthenticated, (req, res) => {
  return res.render("signup", {
    layout: "layouts/login",
  });
});

router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    let contacts = await Contact.find({
      user: mongoose.Types.ObjectId(req.user._id),
    })
      .populate("user")
      .lean();
    if (contacts.length === 0) contacts = undefined;

    return res.render("dashboard", {
      user: req.user,
      contacts,
    });
  } catch (e) {
    let errors = [];
    errors.push({ msg: "Something went wrong" });

    return res.render("dashboard", {
      errors,
      user: req.user,
    });
  }

  return res.render("dashboard", {
    user: req.user,
  });
});

router.post("/dashboard", async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    let contacts = await Contact.find({
      user: mongoose.Types.ObjectId(req.user._id),
    })
      .populate("user")
      .lean();
    if (contacts.length === 0) contacts = undefined;

    let errors = [];

    if (!name || !email || !phone) {
      errors.push({ msg: "Please enter all fields" });
    }

    if (phone.length !== 10) {
      errors.push({ msg: "Phone must be 10 digits" });
    }

    if (name.length < 6) {
      errors.push({ msg: "Name must be at least 6 characters" });
    }

    if (errors.length > 0) {
      return res.render("dashboard", {
        errors,
        user: req.user,
        contacts,
        name,
        email,
        phone,
      });
    } else {
      try {
        const r = await Contact.findOne({
          $and: [
            { phone: phone },
            { user: mongoose.Types.ObjectId(req.user._id) },
          ],
        });

        if (r) {
          errors.push({ msg: "Contact number already exists" });
          return res.render("dashboard", {
            errors,
            contacts,
            user: req.user,
            name,
            email,
            phone,
          });
        } else {
          const newContact = new Contact({
            name,
            email,
            phone,
            user: req.user._id,
          });

          await newContact.save();
          contacts.push(newContact);

          return res.render("dashboard", {
            user: req.user,
            contacts,
            success_msg: "Contact successfully created",
          });
        }
      } catch (e) {
        console.log("Errer in create:", e);

        errors.push({ msg: "Something went wrong" });
        return res.render("dashboard", {
          errors,
          user: req.user,
          name,
          email,
          phone,
        });
      }
    }
  } catch (e) {
    console.log("Errer in create:", e);

    let errors = [];
    errors.push({ msg: "Something went wrong" });
    return res.render("dashboard", {
      errors,
      user: req.user,
    });
  }

  return res.send("hello");
});

module.exports = router;
