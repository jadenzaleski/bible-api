const {DataTypes, Model} = require('sequelize');
const sequelize = require('../../instance');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User extends Model {
}

User.init({
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apiKey: {
        type: DataTypes.STRING,
        unique: true,
    },
    apiKeyCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            user.password = await bcrypt.hash(user.password, 10);
            const apiKey = uuidv4();
            user.apiKey = await bcrypt.hash(apiKey, 10);
        },
    },
    sequelize,
    modelName: 'User'
});

module.exports = User;
