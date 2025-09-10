const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = Router();
const Blog = require('../models/blog'); // Import Blog model
const Comment = require('../models/comment'); // Import Comment model

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Use absolute path
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// GET route - render blog form (protect with authentication)
router.get('/add-new', (req, res) => {
    // Check if user is authenticated
    if (!req.user) {
        return res.redirect('/user/signin');
    }
    
    return res.render('addBlog', {
        user: req.user
    });
});

// POST route - handle form submission
router.post('/', upload.single('coverImage'), async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { title, body } = req.body;
        const coverImage = req.file;

        console.log('Blog submission data:');
        console.log('Title:', title);
        console.log('Body:', body);
        console.log('Cover Image:', coverImage);
        console.log('User:', req.user);

        // Validation
        if (!title || !body) {
            return res.status(400).render('addBlog', {
                user: req.user,
                error: 'Title and body are required'
            });
        }

        // Save blog post to DB
        const newBlog = new Blog({
            title: title.trim(),
            body: body.trim(),
            coverImageURL: coverImage ? `/uploads/${coverImage.filename}` : undefined,
            createdBy: req.user._id,
        });

        const savedBlog = await newBlog.save();
        console.log('Blog saved successfully:', savedBlog._id);
        
        return res.redirect('/');
        
    } catch (error) {
        console.error('Error saving blog:', error);
        
        // Handle multer errors
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).render('addBlog', {
                    user: req.user,
                    error: 'File size too large. Maximum 5MB allowed.'
                });
            }
        }
        
        return res.status(500).render('addBlog', {
            user: req.user,
            error: 'Failed to create blog post. Please try again.'
        });
    }
});

// DELETE route - delete blog (must be before /:id route)
router.delete('/:id/delete', async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const blogId = req.params.id;

        // Find the blog
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Check if user is the author of the blog
        if (blog.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own blogs' });
        }

        // Delete all comments associated with this blog
        await Comment.deleteMany({ blog: blogId });

        // Delete the blog
        await Blog.findByIdAndDelete(blogId);

        console.log('Blog deleted successfully:', blogId);
        
        res.json({ 
            success: true, 
            message: 'Blog deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});

// POST route - add comment to blog
router.post('/:id/comment', async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { content } = req.body;
        const blogId = req.params.id;

        // Validation
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        // Check if blog exists
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Create new comment
        const newComment = new Comment({
            content: content.trim(),
            blog: blogId,
            createdBy: req.user._id
        });

        const savedComment = await newComment.save();
        
        // Populate the comment with user data for response
        const populatedComment = await Comment.findById(savedComment._id)
            .populate('createdBy', 'fullName email');

        console.log('Comment saved successfully:', savedComment._id);
        
        res.json({ 
            success: true, 
            message: 'Comment added successfully',
            comment: populatedComment
        });
        
    } catch (error) {
        console.error('Error saving comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// GET route - view individual blog
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('createdBy', 'fullName email');
        
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        
        // Fetch comments for this blog
        const comments = await Comment.find({ blog: req.params.id })
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });
        
        res.render('viewBlog', {
            user: req.user,
            blog: blog,
            comments: comments
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;