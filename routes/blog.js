const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const router = Router();
const Blog = require('../models/blog'); // Import Blog model

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure 'uploads/' exists at root
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET route - render blog form
router.get('/add-new', (req, res) => {
  return res.render('addBlog', {
    user: req.user
  });
});

// POST route - handle form submission
router.post('/', upload.single('coverImage'), async (req, res) => {
  const { title, body } = req.body;
  const coverImage = req.file;

  console.log('Title:', title);
  console.log('Body:', body);
  console.log('Cover Image:', coverImage);

  // Save blog post to DB
  try {
    const newBlog = new Blog({
      title,
      body,
      coverImageURL: coverImage ? `/uploads/${coverImage.filename}` : undefined,
      createdBy: req.user ? req.user._id : null,
    });

    await newBlog.save();

    return res.redirect('/');
  } catch (error) {
    console.error('Error saving blog:', error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
