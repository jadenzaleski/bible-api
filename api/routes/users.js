const express = require('express');
const router = express.Router();
const UserController = require('../controllers/users');

router.post('/signup', UserController.user_signup);

router.post("/login", UserController.user_login);

router.patch('/regenerate', UserController.user_regenerate);

router.delete('/delete', UserController.user_delete);

module.exports = router;