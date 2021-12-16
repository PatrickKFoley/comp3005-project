module.exports = (sequelize, DataTypes) => { return sequelize.define('publisher', {
    name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bankAccountNum: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},{
    //options
})
};