module.exports = (sequelize, DataTypes) => { return sequelize.define('publisherPhoneNum', {
    name: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    phoneNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false
    }
},
{
    //options
})
};
