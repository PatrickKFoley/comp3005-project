module.exports = (sequelize, DataTypes) => { return sequelize.define('publisherphonenum', {
    name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    phoneNum: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    }
},
{
    //options
})
};
