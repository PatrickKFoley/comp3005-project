module.exports = (sequelize, DataTypes) => { return sequelize.define('purchase', {
    OrderNum: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
})
};