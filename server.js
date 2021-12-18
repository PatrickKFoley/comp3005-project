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
const publisherPhoneNumberModel = require('./models/PublisherPhoneNumberModel.js');
const publishesModel = require('./models/Publishes.js');
const purchaseModel = require('./models/sequelize/PurchaseModel.js')
const purchasesModel = require('./models/sequelize/PurchasesModel.js')
const userModel = require('./models/sequelize/UserModel.js')

const book = bookModel(database, Sequelize)
const bookGenre = bookGenreModel(database, Sequelize)
const cart = cartModel(database, Sequelize);
const publisher = publisherModel(database, Sequelize)
const publisherPhoneNumber = publisherPhoneNumberModel(database, Sequelize);
const publishes = publishesModel(database, Sequelize);
const purchase = purchaseModel(database, Sequelize);
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

app.post("/carts", addToCart);
app.post('/books', addBook);
app.post('/login', login);
app.post('/register', registerUser);
app.post('/order', completeOrder);
app.post('publishers', addPublisher);

app.get('/', getHomePage)
app.get('/books', getBooks);
app.get('/addBook', getAddBookPage)
app.get('/books/:isbn', getBook);
app.get('/login', getLoginPage);
app.get('/logout', logout);
app.get('/register', getRegisterPage);
app.get('/carts/:username', getCart);
app.get('/checkout', getCheckoutPage);
app.get('/orders', getOrdersPage);
app.get('/orders/:orderNum', getOrder);
app.get('/publishers', getPublishers);
app.get('/publishers/:name', getPublisher);
app.get('/sales', getSales);

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
  res.send(pug.renderFile("./views/home.pug", {homePageTitle : 'Look Inna Book', user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}}));
};

//Gets login page
function getLoginPage(req, res){
  if(req.session.loggedin){
    res.redirect("/");
    return;
  }
  res.status(200);
  res.send(pug.renderFile("./views/login.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}}));
};

//Logs user out
function logout(req, res){
	if(req.session.loggedin){
    req.session.loggedin = false;
    req.session.username = undefined;
		res.status(200)
    res.send(pug.renderFile("./views/login.pug"));
	}else{
		res.status(200).send("You cannot log out because you aren't logged in.");
  }
};

//Provides page for user to register
function getRegisterPage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/register.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}}));
};

//adds a new user to the db
function registerUser(req, res){
  (async () => {
      try {
          const newUser = await user.create({username: req.body.username, email: req.body.email, address: req.body.address, name: req.body.name, password: req.body.password});

          res.json({message: "POST received from registerUser"})
      } catch(err) {
          console.log(err)
          res.json({message: "Something went wrong - User probably already in db"})
      }
  })();
}

//logs a user in
function login(req, res){
  (async () => {
      try {
          if (req.session.loggedin){
              req.session.loggedin = false;
              req.session.user = null;
          }
          console.log(req.body)
          const properUser = await database.query("SELECT * FROM users WHERE username = '" + req.body.username + "'", {model: user});
          console.log(properUser[0].dataValues);

          if (req.body.username == properUser[0].dataValues.username && req.body.password == properUser[0].dataValues.password){
              req.session.loggedin = true;
              req.session.user = properUser[0].dataValues;
          }
          res.json({message: "Seems like that worked"})
      } catch(err) {
          console.log(err)
          res.json({message: "Something went wrong"})
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
        res.send(pug.renderFile("./views/partials/books_partial.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}, books: books[0]}));
      }
      else{
        res.send(pug.renderFile("./views/books.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}, books: books[0]}));
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
      res.status(200);
      res.send(pug.renderFile("./views/book.pug", {book: book[0][0], user: req.session}));
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
  res.send(pug.renderFile("./views/addbook.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}}));
};

//add a book
function addBook(req, res){
  (async () => {
      try {
          const newBook = await book.create({isbn: req.body.isbn, title: req.body.title, author: req.body.author, numPages: req.body.numPages, stock: req.body.stock, price: req.body.price});
          var isbn = newBook.dataValues.isbn

          var genres = JSON.parse(req.body.genre)
      
          for (var i = 0; i < genres.length; i++){
              try{
                  await bookGenre.create({isbn: isbn, genre: genres[i]})
                  console.log(genres[i])
              } catch(err){
                  console.log(err)
                  res.json({message: "Something went wrong - genre probably already associated with book"})
              }
          }
          res.json({message: "POST received from addGenre"})
      } catch(err) {
          console.log(err)
          res.json({message: "Something went wrong - Book probably already in db"})
      }
  })();
}

//Get cart with the specific primary key
function getCart(req, res){
  let username = req.params.username;
  (async () => {
    try {
      let userCart = await database.query("Select * From Books Where isbn=(Select isbn From Cart Where username='"+username+"');");
      res.status(200);
      res.send(pug.renderFile("./views/cart.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner, books:userCart}}));
    }
    catch{
      console.log(err);
      res.status(400);
      res.send("Something went wrong");
    }
  })
};

//Get checkout page
function getCheckoutPage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/checkout.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}}));
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
        res.send(pug.renderFile("./views/partials/orders_partial.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}, orders: orders[0]}));
      }
      else{
        res.send(pug.renderFile("./views/orders.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}, orders: orders[0]}));
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
      if (orderNo == undefined) {
        //send everything
        query = 'SELECT name FROM publisher';
      } else {
        //find what they actually want and send it
        query = "SELECT name FROM publisher WHERE name LIKE '%" + name + "%'";
      }

      const publishers = await database.query(query, {type: Sequelize.SELECT})

      res.status(200);
      if(req.query.num=="1"){
        res.send(pug.renderFile("./views/partials/publisher_partial.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}, publishers: publishers[0]}));
      }
      else{
        res.send(pug.renderFile("./views/publishers.pug", {user: {username: req.session.username, loggedin: req.session.loggedin, owner : req.session.owner}, publishers: publishers[0]}));
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
      const publisher = await database.query("SELECT * FROM publisher WHERE name = '" + req.params.name + "'", {type: Sequelize.SELECT});
      res.status(200);
      res.send(pug.renderFile("./views/publisher.pug", {publisher: publisher[0][0], user: req.session}));
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

//add new publisher
function addPublisher(req, res){

};

//Adds to cart
function addToCart(req, res){
  (async() => {
    try {
      let username = req.session.username;
      let isbn = req.body.isbn;
      const cartEntry = await cart.create({ username, isbn });
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
      let username = req.session.username;
      let isbn = req.body.isbn;
      await cart.destroy({ where : {username, isbn} });
      res.status(201);
      res.send("Item Removed From Cart");
    } catch(err) {
      console.log(err)
      res.status(404);
      res.send("Something went wrong");
    }
  })();
};

function completeOrder(req, res){
  (async () => {
    try {
      //COUNT DISTINCT ID IN PURCHASES TO FIND NEW ORDER ID
      //CREATE DATE
      //REMOVE BOOKS FROM CART
      //CREATE NEW ENTRY FOR EACH BOOK IN PURCHASES
    }
    catch{

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