const User = require("../models/user");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');


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
            password: req.body.password,
            apiKey: uuidv4()
        });

        res.status(201).json({
            message: "User created successfully.",
            user: {
                _id: user._id,
                username: user.username,
                apiKey: user.apiKey
            }
        });
    } catch (err) {
        res.status(500).json({
            message: "An error occurred while creating the user.",
            error: err.message,
        });
    }
}


exports.user_login = async (req, res, next) => {
    try {
        const existingUser = await User.findOne({
            where: {
                username: req.body.username
            }
        });

        if (!existingUser) {
            return res.status(401).json({
                message: "Authentication failed.",
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, existingUser.password);
        if (isMatch) {
            return res.status(200).json({
                message: "Authentication Successful.",
                _id: existingUser._id,
                username: existingUser.username,
                apiKey: existingUser.apiKey
            });
        } else {
            return res.status(401).json({
                message: "Authentication failed.",
            });
        }
    } catch (e) {
        res.status(500).json({
            message: "Internal Server Error",
            error: e.message,
        });
    }
};

exports.user_regenerate = async (req, res, next) => {
    try {
        const existingUser = await User.findOne({
            where: {
                username: req.body.username
            }
        });

        if (!existingUser) {
            return res.status(401).json({
                message: "Authentication failed.",
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, existingUser.password);
        if (isMatch) {
            existingUser.apiKey = uuidv4();
            existingUser.apiKeyCount = 0;
            await existingUser.save();

            return res.status(200).json({
                message: "Authentication Successful. API Key Regenerated.",
                _id: existingUser._id,
                username: existingUser.username,
                apiKey: existingUser.apiKey
            });
        } else {
            return res.status(401).json({
                message: "Authentication failed.",
            });
        }
    } catch (e) {
        res.status(500).json({
            message: "Internal Server Error",
            error: e.message,
        });
    }
}

exports.user_delete = async (req, res, next) => {
    try {
        const existingUser = await User.findOne({
            where: {
                username: req.body.username
            }
        });

        if (!existingUser) {
            return res.status(401).json({
                message: "Authentication failed.",
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, existingUser.password);
        if (isMatch) {
            await existingUser.destroy()

            return res.status(200).json({
                message: "Authentication Successful. Deleted user" + req.body.username + "."
            });
        } else {
            return res.status(401).json({
                message: "Authentication failed.",
            });
        }
    } catch (e) {
        res.status(500).json({
            message: "Internal Server Error",
            error: e.message,
        });
    }
}
