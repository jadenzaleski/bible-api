const User = require("../models/user");


exports.user_signup = async (req, res, next) => {
    try {
        const existingUsers = await User.findAll({
            where: {
                username: req.body.username
            }
        });

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "The username " + req.body.username + " already exists.",
            });
        }

        const user = await User.create({
            username: req.body.username,
            password: req.body.password
        });

        res.status(201).json({
            message: "User created successfully.",
            user: {
                _id: user._id,
                username: user.username
            }
        });
    } catch (err) {
        res.status(500).json({
            message: "An error occurred while creating the user.",
            error: err.message,
        });
    }
}


exports.users_login = (req, res, next) => {
}