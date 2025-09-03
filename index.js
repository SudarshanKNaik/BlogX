const express = require('express');
const app = express();
const path = require('path');
const port = 8000;
const userRoute = require('./routes/user');
const mongoose = require('mongoose');

app.set('view engine' , 'ejs'); // setting view engine to ejs
app.set('views' , path.resolve('./views')); // setting views directory to views folder


mongoose.connect('mongodb://localhost:27017/BlogX').then(() => console.log("Connected to MongoDB")) 

app.use(express.urlencoded({ extended: false })); // handling form data 


app.get('/' , (req, res) => {
    res.render('home'); // rendering home.ejs file
})


app.use('/user' , userRoute); // using userRoute for /user path




app.listen(port ,() => console.log(`server is running on port ${port}  `))