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
                type: "POST",
                status: "409 Conflict",
                timestamp: new Date().toISOString(),
                msg: "The username " + req.body.username + " already exists.",
            });
        }

        const user = await User.create({
            username: req.body.username,
            password: req.body.password,
            apiKey: uuidv4()
        });

        res.status(201).json({
            type: "POST",
            status: "201 Created",
            timestamp: new Date().toISOString(),
            msg: "User created successfully.",
            user: {
                _id: user._id,
                username: user.username,
                apiKey: user.apiKey
            }
        });
    } catch (err) {
        res.status(500).json({
            type: "POST",
            status: "500 Internal Server Error",
            timestamp: new Date().toISOString(),
            msg: "An error occurred while creating the user.",
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
                type: "POST",
                status: "401 Unauthorized",
                timestamp: new Date().toISOString(),
                msg: "Authentication failed.",
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, existingUser.password);
        if (isMatch) {
            return res.status(200).json({
                type: "POST",
                status: "200 OK",
                timestamp: new Date().toISOString(),
                msg: "Authentication Successful.",
                _id: existingUser._id,
                username: existingUser.username,
                apiKey: existingUser.apiKey
            });
        } else {
            return res.status(401).json({
                type: "POST",
                status: "401 Unauthorized",
                timestamp: new Date().toISOString(),
                msg: "Authentication failed.",
            });
        }
    } catch (err) {
        res.status(500).json({
            type: "POST",
            status: "500 Internal Server Error",
            timestamp: new Date().toISOString(),
            msg: "Internal Server Error",
            error: err.message,
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
                type: "PATCH",
                status: "401 Unauthorized",
                timestamp: new Date().toISOString(),
                msg: "Authentication failed.",
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, existingUser.password);
        if (isMatch) {
            existingUser.apiKey = uuidv4();
            existingUser.apiKeyCount = 0;
            await existingUser.save();

            return res.status(200).json({
                type: "PATCH",
                status: "200 OK",
                timestamp: new Date().toISOString(),
                msg: "Authentication Successful. API Key Regenerated.",
                _id: existingUser._id,
                username: existingUser.username,
                apiKey: existingUser.apiKey
            });
        } else {
            return res.status(401).json({
                type: "PATCH",
                status: "401 Unauthorized",
                timestamp: new Date().toISOString(),
                msg: "Authentication failed.",
            });
        }
    } catch (err) {
        res.status(500).json({
            type: "PATCH",
            status: "500 Internal Server Error",
            timestamp: new Date().toISOString(),
            msg: "Internal Server Error",
            error: err.message,
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
                type: "DELETE",
                status: "401 Unauthorized",
                timestamp: new Date().toISOString(),
                msg: "Authentication failed.",
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, existingUser.password);
        if (isMatch) {
            await existingUser.destroy()

            return res.status(200).json({
                type: "DELETE",
                status: "200 OK",
                timestamp: new Date().toISOString(),
                msg: "Authentication Successful. Deleted user" + req.body.username + "."
            });
        } else {
            return res.status(401).json({
                type: "DELETE",
                status: "401 Unauthorized",
                timestamp: new Date().toISOString(),
                msg: "Authentication failed.",
            });
        }
    } catch (err) {
        res.status(500).json({
            type: "DELETE",
            status: "500 Internal Server Error",
            timestamp: new Date().toISOString(),
            msg: "Internal Server Error",
            error: err.message,
        });
    }
}
