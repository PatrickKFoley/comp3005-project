module.exports = (sequelize, DataTypes) => { return sequelize.define('bookGenre', {
    isbn: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false
    },
    genre: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    }
},
{
    //options
})
};