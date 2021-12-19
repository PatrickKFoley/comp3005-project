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

            await bookGenre.create({ isbn : "101118794", genre : "Sci-Fi"});
            await bookGenre.create({ isbn : "998784564", genre : "Mystery"});

            await publisher.create({ name : "Penguin", address : "P30 Wallaby Way Sydney", email : "penguin@pub.com", bankAccountNum : "987654321"});
            await publisher.create({ name : "Imperial", address : "Toronto", email : "imperial@pub.com", bankAccountNum : "123456789"});

            await publishes.create({ name : "Penguin", isbn : "101118794"});
            await publishes.create({ name : "Imperial", isbn : "998784564"});

            await publisherPhoneNumber.create({ name : "Penguin", phoneNum : "5194004204"});
            await publisherPhoneNumber.create({ name : "Imperial", phoneNum : "7894561231"});

            let today = new Date();
            await purchases.create({ isbn : "101118794", username : "user", date : Date(), order_number : 1, quantity: 2});
            await purchases.create({ isbn : "998784564", username : "user", date : Date(), order_number : 1, quantity: 1});
        }
        catch(err){
            console.log(err);
            console.log("Error Creating Tables");
        }
    })();
}).catch(err => {console.error('Unable to connect to the database:', err);
});
