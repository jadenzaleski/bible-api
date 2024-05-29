const express = require('express');
const router = express.Router();
const UserController = require('../controllers/users');
const {body} = require("express-validator");

router.post('/signup', [
    body('username').trim().escape(),
    body('password').trim().escape(),
], UserController.user_signup);

router.post("/login",[
    body('username').trim().escape(),
    body('password').trim().escape(),
], UserController.user_login);

router.patch('/regenerate', [
    body('username').trim().escape(),
    body('password').trim().escape(),
], UserController.user_regenerate);

router.delete('/delete', [
    body('username').trim().escape(),
    body('password').trim().escape(),
], UserController.user_delete);

module.exports = router;