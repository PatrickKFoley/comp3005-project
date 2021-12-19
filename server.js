const pug = require("pug");
const express = require("express");
const session = require("express-session");
const bodyParser = require('body-parser');
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
publisher.belongsToMany(book, {foreignKey: "name", through: publishes});
book.belongsToMany(publisher, {foreignKey: "title", through: publishes});

//many to many relationship between User and Book, Purchases
user.belongsToMany(book, {foreignKey: "username", through: purchases});
book.belongsToMany(user, {foreignKey: "isbn", through: purchases});

//many to many relationship between User and Book, Cart
user.belongsToMany(book, {foreignKey: "username", through: cart});
book.belongsToMany(user, {foreignKey: "isbn", through: cart});

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(
  session({
    secret: "some secret key",
    resave: true, // saves the session after ever request
    saveUninitialized: false, // stores the session if it hasn't been stored
  })
);
app.use(express.static("public"));
app.use(express.json());

database.authenticate().then(() => {console.log('Connection has been established successfully.');
}).catch(err => {console.error('Unable to connect to the database:', err);
});

app.put("/carts/:cid", removeFromCart);
app.put("/books/:isbn", removeFromStore);

app.post("/carts", addToCart);
app.post('/books', addBook);
app.post('/login', login);
app.post('/register', registerUser);
app.post('/order', completeOrder);
app.post('/publishers', addPublisher);

app.get('/', getHomePage)
app.get('/books', getBooks);
app.get('/addBook', getAddBookPage)
app.get('/books/:isbn', getBook);
app.get('/login', getLoginPage);
app.get('/logout', logout);
app.get('/register', getRegisterPage);
app.get('/carts', getCart);
app.get('/checkout', getCheckoutPage);
app.get('/orders', getOrdersPage);
app.get('/orders/:orderNum', getOrder);
app.get('/publishers', getPublishers);
app.get('/addpublisher', getAddPublisherPage);
app.get('/publishers/:name', getPublisher);
app.get('/sales', getSales);

//publisher.sync({alter: true});
//publisherPhoneNumber.sync({alter: true});
//publishes.sync({force: true});
//cart.sync({force: true});

//makes sure a user is signed in
function auth(req, res, next){
  if (!req.session.loggedin){
      res.format({"text/html": () => {res.render("./unauthorized")}});
      return;
  }
  next();
}

//makes sure the user is an owner
function ownerAuth(req, res, next){
  if (!req.session.owner){
      res.format({"text/html": () => {res.render("./unauthorized")}});
      return;
  }
  next();
}

//Gets homepage
function getHomePage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/home.pug", {homePageTitle : 'Look Inna Book', user: req.session.user, loggedin: req.session.loggedin}));
};

//Gets login page
function getLoginPage(req, res){
  if(req.session.loggedin){
    res.redirect("/");
    return;
  }
  res.status(200);
  console.log(req.session.user);
  res.send(pug.renderFile("./views/login.pug", {user: req.session.user, loggedin: req.session.loggedin}));
};

//Logs user out
function logout(req, res){
	if(req.session.loggedin){
    req.session.user.owner = undefined;
    req.session.loggedin = false;
    req.session.user.username = undefined;
		res.status(200)
    res.send(pug.renderFile("./views/login.pug"));
	}else{
		res.status(200).send("You cannot log out because you aren't logged in.");
  }
};

//Provides page for user to register
function getRegisterPage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/register.pug", {user: req.session.user, loggedin: req.session.loggedin}));
};

//adds a new user to the db
function registerUser(req, res){
  (async () => {
      try {
          const newUser = await user.create({username: req.body.username, email: req.body.email, address: req.body.address, name: req.body.name, password: req.body.password, owner: req.body.owner});
          console.log(newUser.email.slice(-10));
          req.session.user = {};
          req.session.user.username = req.body.username;
          req.session.user.owner = req.body.owner;
          req.session.loggedin = true;
          res.status(201);
          res.send("/");
      } catch(err) {
          console.log(err);
          res.status(400);
          res.send("Something went wrong - User probably already in db");
      }
  })();
}

//logs a user in
function login(req, res){
  (async () => {
      try {
          if (req.session.loggedin){
              req.session.loggedin = false;
              req.session.user = {};
          }
          const properUser = await database.query("SELECT * FROM users WHERE username = '" + req.body.username + "'", {model: user});
          console.log(properUser[0].dataValues);

          if (req.body.username == properUser[0].dataValues.username && req.body.password == properUser[0].dataValues.password){
              req.session.loggedin = true;
              req.session.user = {};
              req.session.user.owner = properUser[0].dataValues.owner;
              req.session.user.username = properUser[0].dataValues.username;

              res.status(200);
              res.send("/");
          }
          else{
            res.status(404);
            res.send("Password and username do not exist");
            return;
          }
      } catch(err) {
          console.log(err)
          res.status(404);
          res.send("Something went wrong");
      }
  })();
}

//Page for user to query books. Should have params indicating criteria
function getBooks(req, res){
  (async () => {
    try {
      let query = ""
      let title = req.query.title;
      if (title == undefined) {
        //send everything
        query = 'SELECT title, isbn FROM books';
      } else {
        //find what they actually want and send it
        query = "SELECT title, isbn FROM books WHERE title LIKE '%" + title + "%'";
      }

      const books = await database.query(query, {type: Sequelize.SELECT})

      res.status(200);
      if(req.query.num=="1"){
        res.send(pug.renderFile("./views/partials/books_partial.pug", {user: req.session.user, loggedin: req.session.loggedin, books: books[0]}));
      }
      else{
        res.send(pug.renderFile("./views/books.pug", {user: req.session.user, loggedin: req.session.loggedin, books: books[0]}));
      }

    } 
    catch(err) {
      console.log(err)
      res.send("Something went wrong");
    }
  })();
}

//Get book with the specific primary keyS
function getBook(req, res){
  (async() => {
    try {
      const book = await database.query("SELECT * FROM books WHERE isbn = '" + req.params.isbn + "'", {type: Sequelize.SELECT})
      const genres = await database.query('SELECT * FROM bookgenres WHERE isbn = ' + req.params.isbn, {type: Sequelize.SELECT})
      const publisher = await database.query('SELECT name FROM publishes WHERE isbn = ' + req.params.isbn, {type: Sequelize.SELECT})

      console.log(publisher[0]);
      res.status(200);
      res.send(pug.renderFile("./views/book.pug", {book: book[0][0], publisher: publisher[0][0], user: req.session.user, loggedin: req.session.loggedin, genres: genres[0]}));
    } catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
}

//Get the page for an owner to add a book
function getAddBookPage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/addbook.pug", {user: req.session.user, loggedin: req.session.loggedin}));
};

//add a book
function addBook(req, res){
  (async () => {
      try {
          //ensure that the publisher exists
          console.log(req.body)

          const publisher = await database.query("SELECT * FROM publishers WHERE name = '" + req.body.publisher + "'", {type: Sequelize.SELECT});
          if (publisher[0][0] == undefined){
            console.log("publisher not found")
            res.status(400);
            res.send(responseText = "Sorry, please create publisher: " + req.body.publisher + " before adding this book")
            return;
          }

          //creat the entry in the publishes table
          const newPublishes = await publishes.create({isbn: req.body.isbn, name: req.body.publisher})

          //create book
          const newBook = await book.create({isbn: req.body.isbn, title: req.body.title, author: req.body.author, numPages: req.body.numPages, stock: req.body.stock, price: req.body.price});
          var isbn = newBook.dataValues.isbn

          //create genres in the bookGenres relationship
          console.log(req.body.genres)
          genres = req.body.genres;
          genres = genres.split(" ").join("").split(",")
          for (var i = 0; i < genres.length; i++){
            try {
              await bookGenre.create({isbn: isbn, genre: genres[i]})
            }
            catch(err){
              console.log("same genre was entered twice - skipping second")
            }
          }
          res.status(201);
          res.send();
      } catch(err) {
          console.log(err)
          res.json({message: "Something went wrong - Book probably already in db"})
      }
  })();
}

//Get cart with the specific primary key
function getCart(req, res){
  (async () => {
    try {
      let isbns = await database.query("SELECT isbn FROM carts WHERE username = '" + req.session.user.username + "'", {type: Sequelize.SELECT});

      const books = []
      for (var i = 0; i < isbns[0].length; i++){
        const book = await database.query("SELECT title, isbn FROM books WHERE isbn = '" + isbns[0][i].isbn + "'", {type: Sequelize.SELECT});
          books.push(book[0][0])
      }
      //let books = await database.query("Select * From Books Where isbn=(Select isbn From Cart Where username='"+req.session.user+"');");
      res.status(200);
      res.send(pug.renderFile("./views/cart.pug", {user: req.session.user, loggedin: req.session.loggedin, books: books}));
    }
    catch(err){
      console.log(err);
      res.status(400);
      res.send("Something went wrong");
    }
  })();
};

//Get checkout page
function getCheckoutPage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/checkout.pug", {user: req.session.user, loggedin: req.session.loggedin}));
};

//Get page to search for orders. May have query params
function getOrdersPage(req, res){
  (async () => {
    try {
      let query = ""
      let orderNo = req.query.orderNo;
      if (orderNo == undefined) {
        //send everything
        query = 'SELECT OrderNo FROM purchases';
      } else {
        //find what they actually want and send it
        query = "SELECT OrderNo FROM purchases WHERE OrderNo LIKE '%" + orderNo + "%'";
      }

      const orders = await database.query(query, {type: Sequelize.SELECT})

      res.status(200);
      if(req.query.num=="1"){
        res.send(pug.renderFile("./views/partials/orders_partial.pug", {user: req.session.user, loggedin: req.session.loggedin, orders: orders[0]}));
      }
      else{
        res.send(pug.renderFile("./views/orders.pug", {user: req.session.user, loggedin: req.session.loggedin, orders: orders[0]}));
      }

    } 
    catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

//Get order with specific primary key
function getOrder(req, res){
  (async() => {
    try {
      const order = await database.query("SELECT * FROM purchases WHERE OrderNum = '" + req.params.orderNo + "'", {type: Sequelize.SELECT});
      res.status(200);
      res.send(pug.renderFile("./views/order.pug", {order: order[0][0], user: req.session}));
    } catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

//Get list of publishers. May contain query params
function getPublishers(req, res){
  (async () => {
    try {
      let query = ""
      let name = req.query.name;
      console.log(name);
      if (name == undefined) {
        //send everything
        query = 'SELECT name FROM publishers';
      } else {
        //find what they actually want and send it
        query = "SELECT name FROM publishers WHERE name LIKE '%" + name + "%'";
      }

      const publishers = await database.query(query, {type: Sequelize.SELECT})
      res.status(200);
      if(req.query.num=="1"){
        res.send(pug.renderFile("./views/partials/publisher_partial.pug", {user: req.session.user, loggedin: req.session.loggedin, publishers: publishers[0]}));
      }
      else{
        res.send(pug.renderFile("./views/publishers.pug", {user: req.session.user, loggedin: req.session.loggedin, publishers: publishers[0]}));
      }

    } 
    catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

//Get a specific publisher
function getPublisher(req, res){
  (async() => {
    try {
      const publisher = await database.query("SELECT * FROM publishers WHERE name = '" + req.params.name + "'", {type: Sequelize.SELECT});
      const publishes = await database.query("SELECT books.isbn, name, title FROM publishes, books WHERE publishes.isbn = books.isbn AND name = '" + req.params.name + "'", {type: Sequelize.SELECT});
      const phoneNums = await database.query("SELECT \"phoneNum\" FROM \"publisherPhoneNums\" WHERE name = '" + req.params.name + "'", {type: Sequelize.SELECT});

      console.log(phoneNums[0])

      res.status(200);
      res.send(pug.renderFile("./views/publisher.pug", {publisher: publisher[0][0], publishes: publishes[0], phoneNums: phoneNums[0], user: req.session.user, loggedin: req.session.loggedin}));
    } catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

//Get a page which displays store stats. Will need to do some
// analysis for this perhaps.
function getSales(req, res){
  sales = {income : 0, expenses : 0, genres : {}, authors : {}};
  res.status(200);
  res.send(pug.renderFile("./views/sales.pug", {sales, user: req.session}));
};

//get the add publisher page
function getAddPublisherPage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/addpublisher.pug", {user: req.session.user, loggedin: req.session.loggedin}));
};

//add new publisher
function addPublisher(req, res){
  (async () => {
    try {
        console.log(req.body)
        const newPublisher = await publisher.create({name: req.body.name, address: req.body.address, email: req.body.email, bankAccountNum: req.body.bankNum});
        var name = newPublisher.dataValues.name

        phoneNums = req.body.phoneNum;
        phoneNums = phoneNums.split(" ").join("").split(",")
    
        for (var i = 0; i < phoneNums.length; i++){
          try{
            await publisherPhoneNumber.create({name: name, phoneNum: phoneNums[i]})
          }
          catch(err){
            console.log("same phone number added twice - skipping second")
          }
        }
        res.status(201);
        res.send();
    } catch(err) {
        console.log(err)
        res.json({message: "Something went wrong - Book probably already in db"})
    }
  })();
};

//Adds to cart
function addToCart(req, res){
  (async() => {
    try {
      let username = req.session.user.username;
      let isbn = req.body.isbn;
      let result = await cart.findOne({where : {username, isbn}});
      if (result) {
        await cart.update(
          { quantity: parseInt(result.quantity)+1 },
          { where: {username, isbn} }
        );
      } else {
        await cart.create({isbn: isbn, username: username, quantity: 1});
      }
      res.status(201);
      res.send("Item Added to Cart");
    } catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

//Removes from cart
function removeFromCart(req, res){
  (async() => {
    try {
      console.log(req.body.isbn)
      let username = req.session.user.username;
      let isbn = req.body.isbn;

      let result = await cart.findOne({where : {username, isbn}});
      if (result.quantity>1) {
        await cart.update(
          { quantity: result.quantity-1 },
          { where: {username, isbn} }
        );
      } else {
        await cart.destroy({ where : {username, isbn} });
      }

      res.status(201);
      res.send("/carts");
    } catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

//Removes Book from store
function removeFromStore(req, res){
  (async () => {
    try {
      await book.destroy({where : {isbn : req.session.isbn}});
      res.status(201);
      res.send("/");
    }
    catch{
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

//Checkout for the user
function completeOrder(req, res){
  (async () => {
    try {
      //COUNT DISTINCT ID IN PURCHASES TO FIND NEW ORDER ID
      //CREATE DATE
      //REMOVE BOOKS FROM CART
      //CREATE NEW ENTRY FOR EACH BOOK IN PURCHASES
      const uniquePurchases = (await database.query("SELECT count(*) FROM (SELECT distinct(isbn) FROM purchases) AS temp;", {type: Sequelize.SELECT}))[0][0];
      let newOrderNum = uniquePurchases + 1;
      let purchaseDate = new Date();
      let username = req.session.user.username;
      let purchasedBooks = await cart.findAll({where: {username}});
      for(boughtBook of purchasedBooks){
        let isbn = boughtBook.isbn;
        let quantity = boughtBook.quantity;
        await purchases.create({isbn, username, date: purchaseDate, orderNo: newOrderNum, quantity});
        await cart.destroy({where: {username, isbn}});
      }
      res.status(200);
      res.send("/orders/" + newOrderNum);

    }
    catch{
      res.status(400);
      res.send("Sorry there was a problem on our end");
    }
  })();
};

app.listen(port, () => console.log(`app listening on port ${port}`)) 

//HELPER FUNCTIONS

//CODE TAKEN FROM STACK OVERFLOW. I DO NOT THINK THIS
//IS PLAGUERISM AS ITS A SIMPLE CONVERSION FUNCTION
//WHICH DOES NOT RELATE TO MY UNDERSTANDING OF DATABASES
//https://stackoverflow.com/questions/563406/add-days-to-javascript-date
Date.prototype.addDays = function(days){
  let date = new Date(this.valueOf);
  date.setDate(date.getDate() + days);
  return date;
};