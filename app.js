const express = require('express');
const app = express();
const morgan = require('morgan');
const { query, param} = require('express-validator');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./api/routes/users');
const VerseController = require("./api/controllers/verses");
const User = require("./api/models/user");
const rateLimitMiddleware = require("./rateLimiter");


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(rateLimitMiddleware);
app.use('/users', userRoutes);


// Route for retrieving verses
app.get('/:translation/:book', [
    // Add validation and sanitization middleware
    param('translation').notEmpty().trim().escape(),
    param('book').notEmpty().trim().escape(),
    query('start').trim().escape(),
    query('end').trim().escape(),
    query('superscript').trim().escape(),
    query('apiKey').trim().escape()
], VerseController.retrieve);


// Handle CORS errors with headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
        return res.status(200).json({});
    }
    next();
})

// Handle all not found requests
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
})

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: error.message,
    })
})

module.exports = app;