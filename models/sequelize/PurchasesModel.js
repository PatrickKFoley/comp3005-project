module.exports = (sequelize, Datatypes) => {
    return sequelize.define('purchases', {
        isbn: {
            type: Datatypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        username: {
            type: Datatypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        orderNo: {
            type: Datatypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        date: {
            type: Datatypes.DATE,
            allowNull: false
        },
        quantity: {
            type: Datatypes.BIGINT,
            allowNull: false
        }
    });
};