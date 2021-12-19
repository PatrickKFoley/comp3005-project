module.exports = (sequelize, Datatypes) => {
    return sequelize.define('book', {
        isbn: {
            type: Datatypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        title: {
            type: Datatypes.STRING,
            allowNull: false
        },
        author: {
            type: Datatypes.STRING,
            allowNull: false
        },
        numPages: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        stock: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        price: {
            type: Datatypes.DOUBLE,
            allowNull: false
        },
        royalty: {
            type: Datatypes.DOUBLE,
            allowNull: false
        }
    });
}
