const { UniqueConstraintError } = require('sequelize');
const Sequelize = require('sequelize');
const database = new Sequelize('postgres://postgres:password@localhost:5432/postgres');

module.exports = (database, DataTypes) => { return database.define('user', {
    username: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING, //same as VARCHAR(255)
        allowNull: false
    },
    address: {
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    owner: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},
{
    //options
})
};