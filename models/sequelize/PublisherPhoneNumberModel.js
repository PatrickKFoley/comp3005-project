module.exports = (sequelize, DataTypes) => { return sequelize.define('publisherPhoneNum', {
    name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    phoneNum: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false
    }
},
{
    //options
})
};
