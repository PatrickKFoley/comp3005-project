module.exports = (sequelize, Datatypes) => {
    return sequelize.define('Cart', {
        isbn: {
            type: Datatypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        username: {
            type: Datatypes.STRING,
            primaryKey: true,
            allowNull: false
        }
    });
};