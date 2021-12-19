module.exports = (sequelize, Datatypes) => {
    return sequelize.define('cart', {
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
        quantity: {
            type: Datatypes.BIGINT,
            allowNull: false
        }
    });
};