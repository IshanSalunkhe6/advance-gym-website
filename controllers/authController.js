const path = require('path');
const Gym = require('../models/gym');

// GET /login
exports.getLogin = (req, res) => {
  res.render('connect/login');
};

// POST /login
exports.postLogin = async (req, res) => {
  try {
    const user = await Gym.findOne({ email: req.body.email, name: req.body.name });

    if (!user) {
      return res.send("User not found");
    }

    if (user.password === req.body.password) {
      req.session.userId = user._id;
      return res.redirect('/homepage');
    } else {
      return res.render('connect/login', { error: "Wrong password" });
    }
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

// GET /create (signup page)
exports.getCreate = (req, res) => {
  res.render('connect/create');
};

// POST /create (register)
exports.postCreate = async (req, res) => {
  const newEmail = new Gym(req.body);
  await newEmail.save();
  res.redirect('/login');
};

// GET /homepage
exports.getHomepage = async (req, res) => {
  try {
    const userinfo = await Gym.findById(req.session.userId);
    if (!userinfo) {
      return res.redirect('/login');
    }
    res.render('connect/home', { userinfo });
  } catch (error) {
    console.error('Error', error);
    res.send('Error');
  }
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};

// GET /ai_personal_trainer
exports.getAIPersonalTrainer = (req, res) => {
  res.render('connect/ai_personal_trainer');
};
