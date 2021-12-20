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
publisher.belongsToMany(book, {foreignKey: "name", through: {model: publishes, unique: false}});
book.belongsToMany(publisher, {foreignKey: "isbn", through: {model: publishes, unique: false}});

//many to many relationship between User and Book, Purchases
user.belongsToMany(book, {foreignKey: "username", through: {model: purchases, unique: false}});
book.belongsToMany(user, {foreignKey: "isbn", through: {model: purchases, unique: false}});

//many to many relationship between User and Book, Cart
user.belongsToMany(book, {foreignKey: "username", through: {model: cart, unique: false}});
book.belongsToMany(user, {foreignKey: "isbn", through: {model: cart, unique: false}});

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

            //"CURRENT_DATE;" "CURRENT_DATE - INTERVAL'1 month'"
            await database.query("CREATE OR REPLACE FUNCTION restock_books() RETURNS trigger as $stamp$ BEGIN UPDATE books SET stock=subquery.total FROM (SELECT SUM(quantity) AS total FROM purchases WHERE date>(CURRENT_DATE - INTERVAL '1 month') and isbn=NEW.isbn) AS subquery WHERE isbn=NEW.isbn AND stock=0; RETURN NEW; END; $stamp$ LANGUAGE plpgsql ");
            await database.query("CREATE TRIGGER restock AFTER INSERT ON purchases FOR EACH ROW EXECUTE PROCEDURE restock_books();");

            await user.create({ username : "owner", password : "password", owner : true, name : "Me", email : "owner@owner.com", address : "1290 POW"});
            await user.create({ username : "user", password : "password", owner : false,  name : "You", email : "user@user.com", address : "Home"});

            await book.create({ isbn : "101118794", title : "Enders Game", author : "Orson Scott Card", numPages : 458, stock : 10, price : "10.99", royalty: 50});
            await book.create({ isbn : "998784564", title : "Ice", author : "Anna Kavan", numPages : 185,  stock : 3, price : "15.99", royalty: 12});
            await book.create({ isbn : "0553579908", title : "A Clash of Kings", author : "George R.R. Martin", numPages : 967,  stock : 10, price : "9.99", royalty: 25});
            await book.create({ isbn : "9780553573428", title : "A Storm of Swords", author : "George R.R. Martin", numPages : 1128,  stock : 13, price : "11.99", royalty: 25});
            await book.create({ isbn : "9780553582024", title : "A Feast For Crows", author : "George R.R. Martin", numPages : 976,  stock : 8, price : "10.99", royalty: 25});
            await book.create({ isbn : "9781101886038", title : "A Dance With Dragons", author : "George R.R. Martin", numPages : 1051,  stock : 15, price : "11.99", royalty: 25});
            await book.create({ isbn : "9789113014081", title : "The Girl with the Dragon Tattoo", author : "Stieg Larsson", numPages : 651,  stock : 16, price : "19.99", royalty: 22});

            await bookGenre.create({ isbn : "101118794", genre : "Sci-Fi"});
            await bookGenre.create({ isbn : "998784564", genre : "Mystery"});
            await bookGenre.create({ isbn : "0553579908", genre : "Fantasy"});
            await bookGenre.create({ isbn : "0553579908", genre : "Dark"});
            await bookGenre.create({ isbn : "0553579908", genre : "Adult"});
            await bookGenre.create({ isbn : "9780553573428", genre : "Fantasy"});
            await bookGenre.create({ isbn : "9780553573428", genre : "Dark"});
            await bookGenre.create({ isbn : "9780553573428", genre : "Adult"});
            await bookGenre.create({ isbn : "9780553582024", genre : "Fantasy"});
            await bookGenre.create({ isbn : "9780553582024", genre : "Dark"});
            await bookGenre.create({ isbn : "9780553582024", genre : "Adult"});
            await bookGenre.create({ isbn : "9781101886038", genre : "Fantasy"});
            await bookGenre.create({ isbn : "9781101886038", genre : "Dark"});
            await bookGenre.create({ isbn : "9781101886038", genre : "Adult"});
            await bookGenre.create({ isbn : "9789113014081", genre : "Thriller"});
            await bookGenre.create({ isbn : "9789113014081", genre : "Adult"});

            await publisher.create({ name : "Penguin", address : "P30 Wallaby Way, Sydney", email : "penguin@pub.com", bankAccountNum : "987654321"});
            await publisher.create({ name : "Imperial", address : "18 Braden Way, Vaughan, Ontario", email : "imperial@pub.com", bankAccountNum : "123456789"});
            await publisher.create({ name : "Bantem Dell", address : "1745 Broadway, New York City, New York", email : "bantemdell@pub.com", bankAccountNum : "678954321"});
            await publisher.create({ name : "Norstedts Forlag", address : "Tryckerigatan 4, 111 28 Stockholm", email : "norstedtsforlag@pub.com", bankAccountNum : "123459876"});

            await publishes.create({ name : "Penguin", isbn : "101118794"});
            await publishes.create({ name : "Imperial", isbn : "998784564"});
            await publishes.create({ name : "Bantem Dell", isbn : "0553579908"});
            await publishes.create({ name : "Bantem Dell", isbn : "9780553573428"});
            await publishes.create({ name : "Bantem Dell", isbn : "9780553582024"});
            await publishes.create({ name : "Bantem Dell", isbn : "9781101886038"});
            await publishes.create({ name : "Norstedts Forlag", isbn : "9789113014081"});

            await publisherPhoneNumber.create({ name : "Penguin", phoneNum : "5194004204"});
            await publisherPhoneNumber.create({ name : "Imperial", phoneNum : "7894561231"});
            await publisherPhoneNumber.create({ name : "Imperial", phoneNum : "6133269808"});
            await publisherPhoneNumber.create({ name : "Bantem Dell", phoneNum : "6133678990"});
            await publisherPhoneNumber.create({ name : "Bantem Dell", phoneNum : "6133678999"});
            await publisherPhoneNumber.create({ name : "Norstedts Forlag", phoneNum : "6138906677"});


            let today = new Date();
            await purchases.create({ isbn : "101118794", username : "user", date : Date(), order_number : 1, quantity: 2});
            await purchases.create({ isbn : "998784564", username : "user", date : Date(), order_number : 1, quantity: 1});
            await purchases.create({ isbn : "9780553573428", username : "user", date : Date(), order_number : 1, quantity: 3});
            await purchases.create({ isbn : "9789113014081", username : "user", date : Date(), order_number : 1, quantity: 1});
        }
        catch(err){
            console.log(err);
            console.log("Error Creating Tables");
        }
    })();
}).catch(err => {console.error('Unable to connect to the database:', err);
});
