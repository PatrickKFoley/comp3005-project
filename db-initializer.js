const { UniqueConstraintError } = require('sequelize');
const Sequelize = require('sequelize');
const database = new Sequelize('postgres://postgres:password@localhost:5432/postgres');

const bookModel = require('./models/sequelize/bookModel.js');
const bookGenreModel = require('./models/sequelize/BookGenreModel.js')
const cartModel = require('./models/sequelize/CartModel.js')
const publisherModel = require('./models/sequelize/PublisherModel.js')
const publisherPhoneNumberModel = require('./models/sequelize/PublisherPhoneNumberModel.js');
const publishesModel = require('./models/sequelize/PublishesModel.js');
const purchasesModel = require('./models/sequelize/PurchasesModel.js')
const userModel = require('./models/sequelize/UserModel.js')

const book = bookModel(database, Sequelize)
const bookGenre = bookGenreModel(database, Sequelize)
const cart = cartModel(database, Sequelize);
const publisher = publisherModel(database, Sequelize)
const publisherPhoneNumber = publisherPhoneNumberModel(database, Sequelize);
const publishes = publishesModel(database, Sequelize);
const purchases = purchasesModel(database, Sequelize);
const user = userModel(database, Sequelize);

//many to many relationship between Publishers and Books
publisher.belongsToMany(book, {through: publishes});
book.belongsToMany(publisher, {through: publishes});

//many to many relationship between User and Book, Purchases
user.belongsToMany(book, {through: purchases});
book.belongsToMany(user, {through: purchases});

//many to many relationship between User and Book, Cart
user.belongsToMany(book, {foreignKey: user.userID, through: cart});
book.belongsToMany(user, {foreignKey: book.ISBN, through: cart});

database.authenticate().then(() => {
    console.log('Connection has been established successfully.');
    (async () => {
        try {
            await user.sync({ force: true });
            await book.sync({ force: true });
            await bookGenre.sync({ force: true });
            await cart.sync({ force: true });
            await publisher.sync({ force: true });
            await publisherPhoneNumber.sync({ force: true });
            await publishes.sync({ force: true });
            await purchases.sync({ force: true });


            await user.create({ username : "owner", password : "password", owner : true, name : "Me", email : "owner@owner.com", address : "1290 POW"});
            await user.create({ username : "user", password : "password", owner : false,  name : "You", email : "user@user.com", address : "Home"});

            await book.create({ isbn : "101118794", title : "Ender Game", author : "Orson Scott Card", numPages : 458, stock : 10, price : "10.99"});
            await book.create({ isbn : "998784564", title : "Ice", author : "Anna Kavan", numPages : 185,  stock : 3, price : "15.99"});

            await bookGenre.create({ isbn : "101118794", genre : "Sci-Fi"});
            await bookGenre.create({ isbn : "998784564", genre : "Mystery"});

            await publisher.create({ name : "Penguin", address : "P30 Wallaby Way Sydney", email : "penguin@pub.com", bankAccountNum : "987654321"});
            await publisher.create({ name : "Imperial", address : "Toronto", email : "imperial@pub.com", bankAccountNum : "123456789"});

            await publishes.create({ name : "Penguin", isbn : "101118794"});
            await publishes.create({ name : "Imperial", isbn : "998784564"});

            await publisherPhoneNumber.create({ name : "Penguin", phoneNum : "5194004204"});
            await publisherPhoneNumber.create({ name : "Imperial", phoneNum : "7894561231"});

            await purchases.create({ isbn : "101118794", username : "user", date : Date(), orderNo : 0001});
            await purchases.create({ isbn : "998784564", username : "user", date : Date(), orderNo : 0001});
        }
        catch(err){
            console.log(err);
            console.log("Error Creating Tables");
        }
    })();
}).catch(err => {console.error('Unable to connect to the database:', err);
});