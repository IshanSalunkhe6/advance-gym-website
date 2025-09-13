const fs = require('fs');
const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const mongoose = require('mongoose');

const app = express();

// --- ensure uploads dir + static like before ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static('public'));
app.use('/test7', express.static(path.join(__dirname, 'test7')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// session (same settings)
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// --- routes ---
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');

// mount to keep original paths working 1:1
app.use('/', authRoutes);
app.use('/', groupRoutes);

// db + server
const PORT = 5000;

(async function main() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gym');
    console.log('connected');
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  } catch (err) {
    console.log(err);
  }
})();
