const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

// middleware copied exactly from your original logic
function checkAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

router.get('/login', auth.getLogin);
router.post('/login', auth.postLogin);

router.get('/create', auth.getCreate);
router.post('/create', auth.postCreate);

router.get('/homepage', checkAuthenticated, auth.getHomepage);
router.get('/logout', auth.logout);

router.get('/ai_personal_trainer', checkAuthenticated, auth.getAIPersonalTrainer);

module.exports = router;
