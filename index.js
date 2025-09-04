const express = require('express');
const app = express();
const path = require('path');
const port = 8000;
const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const {
  checkForAuthenticationCookie,
} = require('./mwares/authentication');

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/BlogX', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());  // For JSON parsing
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token')); // sets req.user and res.locals.user

// Static files for uploaded files
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.get('/', (req, res) => {
  console.log("REQ.USER:", req.user);
  res.render('home'); // res.locals.user is available in EJS by default
});

app.use('/user', userRoute);
app.use('/blog', blogRoute);

// Start server
app.listen(port, () => console.log(`Server is running on port ${port}`));
