module.exports = (sequelize, Datatypes) => {
    return sequelize.define('publishes', {
        isbn: {
            type: Datatypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: Datatypes.STRING,
            primaryKey: true,
            allowNull: false
        }
    });
}