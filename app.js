require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT ;
const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const Blog = require('./models/blog');
const { checkForAuthenticationCookie } = require('./mwares/authentication');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(' MongoDB connection error:', err));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token'));

// Static
app.use('/uploads', express.static(path.resolve('uploads')));

// Serve public static assets (css, js, images)
app.use(express.static(path.resolve('public')));

// Home route
app.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({})
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    console.log(" Blogs fetched:", blogs.length);

    res.render('home', { 
      user: req.user,
      blogs 
    });
  } catch (error) {
    console.error(' Error fetching blogs:', error);
    res.render('home', { 
      user: req.user,
      blogs: [] 
    });
  }
});

// Routes
app.use('/user', userRoute);
app.use('/blog', blogRoute);

// Start server
app.listen(port, () => console.log(`🚀 Server is running on http://localhost:${port}`));