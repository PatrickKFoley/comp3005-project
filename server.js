//Required modules
const pug = require("pug");
const express = require("express");
const session = require("express-session");
const bodyParser = require('body-parser');
const { UniqueConstraintError } = require('sequelize');
const Sequelize = require('sequelize');
const database = new Sequelize('postgres://postgres:Clones12!@localhost:5432/postgres');

//Define models
const bookModel = require('./models/sequelize/bookModel.js');
const bookGenreModel = require('./models/sequelize/BookGenreModel.js')
const cartModel = require('./models/sequelize/CartModel.js')
const publisherModel = require('./models/sequelize/PublisherModel.js')
const publisherPhoneNumberModel = require('./models/sequelize/PublisherPhoneNumberModel.js');
const publishesModel = require('./models/sequelize/PublishesModel.js');
const purchasesModel = require('./models/sequelize/PurchasesModel.js')
const userModel = require('./models/sequelize/UserModel.js')

//Get models to perform queries on
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

//Using express to define server routes
const app = express();
const port = 3000;

//Creates session object to store cookies
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

//Connect to db
database.authenticate().then(() => {console.log('Connection has been established successfully.');
}).catch(err => {console.error('Unable to connect to the database:', err);
});

//PUT
app.put("/carts/:cid", removeFromCart);
app.put("/books/:isbn", removeFromStore);

//POST
app.post("/carts", addToCart);
app.post('/books', addBook);
app.post('/login', login);
app.post('/register', registerUser);
app.post('/orders', completeOrder);
app.post('/publishers', addPublisher);

//GET
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

//Gets homepage
function getHomePage(req, res){
  res.status(200);
  res.send(pug.renderFile("./views/home.pug", {homePageTitle : 'Look Inna Book', user: req.session.user, loggedin: req.session.loggedin}));
};

//Gets login page
function getLoginPage(req, res){
  if(req.session.loggedin){
    //Redirect to home page if logged in
    res.redirect("/");
    return;
  }
  res.status(200);
  console.log(req.session.user);
  res.send(pug.renderFile("./views/login.pug", {user: req.session.user, loggedin: req.session.loggedin}));
};

//Logs user out
function logout(req, res){
  //Makes user "logged out" from perspective of the session
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
          //Create user in db
          const newUser = await user.create({username: req.body.username, email: req.body.email, address: req.body.address, name: req.body.name, password: req.body.password, owner: req.body.owner});

          //Create user object within session
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
          //If user is logged in this is probably an error so log them out
          if (req.session.loggedin){
              req.session.loggedin = false;
              req.session.user = {};
              res.status(404);
              res.send("Something went wrong");
              return;
          }

          //Query for user
          const properUser = await database.query("SELECT * FROM users WHERE username = '" + req.body.username + "'", {model: user});

          //Make sure username and password match
          if (req.body.username == properUser[0].dataValues.username && req.body.password == properUser[0].dataValues.password){
            //Log user in to session
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
      let query = "";
      let search = req.query.search;

      if (search == undefined) {
        //send everything
        query = 'SELECT title, isbn FROM books';
      } else {
        //find what they actually want and send it
        query = "SELECT title, isbn FROM books WHERE title LIKE '%" + search + "%'";
      }

      //Check what user querying for
      if (req.query.option == "title"){
        query = "SELECT title, isbn FROM books WHERE title LIKE '%" + search + "%'";
      } else if (req.query.option == "author"){
        query = "SELECT title, isbn FROM books WHERE author LIKE '%" + search + "%'";
      } else if (req.query.option == "isbn"){
        query = "SELECT title, isbn FROM books WHERE isbn =" + search;
      } else if (req.query.option == "price>"){
        query = "SELECT title, isbn FROM books WHERE price > " + search;
      } else if (req.query.option == "price<"){
        query = "SELECT title, isbn FROM books WHERE price < " + search;
      }

      const books = await database.query(query, {type: Sequelize.SELECT})

      res.status(200);

      //If user already has page then just return the list of books, otherwise return whole page
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
      //Gets information relevant to book
      const book = await database.query("SELECT * FROM books WHERE isbn = '" + req.params.isbn + "'", {type: Sequelize.SELECT});
      const genres = await database.query('SELECT * FROM bookgenres WHERE isbn = ' + req.params.isbn, {type: Sequelize.SELECT});
      const publisher = await database.query('SELECT name FROM publishes WHERE isbn = ' + req.params.isbn, {type: Sequelize.SELECT});

      res.status(200);
      res.send(pug.renderFile("./views/book.pug", {book: book[0][0], publishers: publisher[0], user: req.session.user, loggedin: req.session.loggedin, genres: genres[0]}));
    
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

          //ensure that each publisher exists
          var publishers = req.body.publisher;
          publishers = publishers.split(",");

          //Removes whitespace
          for (var i = 0; i < publishers.length; i++){
            publishers[i] = publishers[i].trim();
          }

          //Adds new publisher for each publisher book was given
          for (var i = 0; i < publishers.length; i++){
              const publisher = await database.query("SELECT * FROM publishers WHERE name = '" + publishers[i] + "'", {type: Sequelize.SELECT});
              if (publisher[0][0] == undefined){
                console.log("publisher not found")
                res.status(400);
                res.send(responseText = "Sorry, please create publisher: " + publishers[i] + " before adding this book")
                return;
              }
          }

          //create book
          const newBook = await book.create({isbn: req.body.isbn, title: req.body.title, author: req.body.author, numPages: req.body.numPages, stock: req.body.stock, price: req.body.price, royalty: req.body.royalty});
          var isbn = newBook.dataValues.isbn;

          //all publishers exist, add book and publisher to publishes
          for (var i = 0; i < publishers.length; i++){
            try{
              var newPublishes = await publishes.create({isbn: req.body.isbn, name: publishers[i]});
            } catch(err){
              console.log("Same publisher added twice - skipping second")
            }
          }

          genres = req.body.genres;
          genres = genres.split(" ").join("").split(",");

          //Add all listed genres to bookGenre
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
          res.status(400);
          res.send("Something went wrong - Book probably already in db or incorrect input");
      }
  })();
}

//Get cart with the specific primary key
function getCart(req, res){
  (async () => {
    try {
      let isbns = await database.query("SELECT isbn, quantity FROM carts WHERE username = '" + req.session.user.username + "'", {type: Sequelize.SELECT});
      const books = [];

      //Gets data for each book
      for (var i = 0; i < isbns[0].length; i++){
          const book = await database.query("SELECT title, isbn FROM books WHERE isbn = '" + isbns[0][i].isbn + "'", {type: Sequelize.SELECT});
          books.push(book[0][0]);
          books[i].quantity = isbns[0][i].quantity;
      }
      
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

      //Builds query depending on if user entered anything to search
      if (orderNo == undefined) {
        //send everything
        query = 'SELECT distinct(order_number) FROM purchases';
      } else {
        //find what they actually want and send it
        query = "SELECT order_number FROM purchases WHERE order_number LIKE '%" + orderNo + "%'";
      }

      const ord = await database.query(query, {type: Sequelize.SELECT});
      let orders = ord[0];

      res.status(200);
      //Only sends list of orders if user already has page
      if(req.query.num=="1"){
        res.send(pug.renderFile("./views/partials/orders_partial.pug", {user: req.session.user, loggedin: req.session.loggedin, orders}));
      }
      else{
        res.send(pug.renderFile("./views/orders.pug", {user: req.session.user, loggedin: req.session.loggedin, orders}));
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
      const ord = await purchases.findAll({where: {order_number: req.params.orderNum}});
      const isbns = await database.query("SELECT isbn FROM purchases WHERE order_number = " + req.params.orderNum, {type: Sequelize.SELECT});
      const books = [];

      //Gets data for each book in order
      for (var i = 0; i < isbns[0].length; i++){
        var book = await database.query("SELECT title, isbn FROM books WHERE isbn = " + isbns[0][i].isbn, {type: Sequelize.SELECT});
        books.push(book[0][0]);
      }

      //Creates delivery date on the fly. Assumes it's two days out from order date
      let today = new Date(ord[0].date);
      let newDate = new Date(today.setDate(today.getDate() + 2));

      //Creates order object to generate page with
      let order = {
        order_no : ord[0].order_number,
        date: ord[0].date,
        delivery_date: newDate,
        delivered: (new Date().getTime() > newDate.getTime()),
        username: ord[0].username
      };

      res.status(200);
      res.send(pug.renderFile("./views/order.pug", {user: req.session.user, loggedin: req.session.loggedin, order, books: books}));
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

      if (name == undefined) {
        //send everything
        query = 'SELECT name FROM publishers';
      } else {
        //find what they actually want and send it
        query = "SELECT name FROM publishers WHERE name LIKE '%" + name + "%'";
      }

      const publishers = await database.query(query, {type: Sequelize.SELECT})

      res.status(200);
      //Only sends list of publishers if already has page
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
      //Queries data relevant to publisher page
      const publisher = await database.query("SELECT * FROM publishers WHERE name = '" + req.params.name + "'", {type: Sequelize.SELECT});
      const publishes = await database.query("SELECT books.isbn, name, title FROM publishes, books WHERE publishes.isbn = books.isbn AND name = '" + req.params.name + "'", {type: Sequelize.SELECT});
      const phoneNums = await database.query("SELECT \"phoneNum\" FROM publisherphonenums WHERE name = '" + req.params.name + "'", {type: Sequelize.SELECT});

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
  (async() => {
    try {
      let sales = {income : 0, expenses : 0, genres : {}, authors : {}, lastMonthIncome: 0, lastMonthExpenses: 0};
      let bookSalesTotal = {};
      let bookSalesMonth = {};

      //FOR TOTAL BOOK SALES
      let bookSales = {};
      let numSold;

      //Queries numsold books of all time
      numSold = (await database.query("SELECT isbn, SUM(quantity) AS total_sold from purchases GROUP BY isbn;", {type: Sequelize.SELECT}))[0];

      //Iterates over all sold books and accumulates relevant data to provide stats
      for(let i = 0; i<numSold.length; i++){
        bookResult = await book.findOne({where: {isbn:numSold[i].isbn}});
        bookGen = await bookGenre.findAll({where: {isbn:numSold[i].isbn}});

        //List of genres associated with book are in array that needs to be extracted
        let bGen = []
        for(b of bookGen){
          bGen.push(b.genre);
        }

        //Creates object for book representing basic data to get sales nums e.g. price, numsold, etc
        bookSales[numSold[i].isbn] = {};
        bookSales[numSold[i].isbn].num = numSold[i].total_sold;
        bookSales[numSold[i].isbn].author = bookResult.author;
        bookSales[numSold[i].isbn].price = bookResult.price;
        bookSales[numSold[i].isbn].royalty = bookResult.royalty;
        bookSales[numSold[i].isbn].genres = bGen;
      }
      bookSalesTotal = JSON.parse(JSON.stringify(bookSales));
      //END FOR BOOKSALES TOTAL

      //FOR BOOK SALES THIS MONTH
      bookSales = {};
      numSold;

      //Queries books sold in the past month
      numSold = (await database.query("SELECT isbn, SUM(quantity) AS total_sold from purchases WHERE date>(CURRENT_DATE - INTERVAL '1 month') GROUP BY isbn;", {type: Sequelize.SELECT}))[0];
      
      //For each book get basic sales data
      for(let i = 0; i<numSold.length; i++){
        bookResult = await book.findOne({where: {isbn:numSold[i].isbn}});
        bookSales[numSold[i].isbn] = {};
        bookSales[numSold[i].isbn].num = numSold[i].total_sold;
        bookSales[numSold[i].isbn].price = bookResult.price;
        bookSales[numSold[i].isbn].royalty = bookResult.royalty;
      }
      bookSalesMonth = JSON.parse(JSON.stringify(bookSales));
      //END FOR BOOKSALESMONTH

      //Keys to iterate over the dicts with
      let keys = Object.keys(bookSalesTotal);
      let keysMonth = Object.keys(bookSalesMonth);

      //Fill out values for all time sales
      for(k of keys){
        //Increment sales
        sales.income += (bookSalesTotal[k].price * bookSalesTotal[k].num);
        sales.expenses += ((bookSalesTotal[k].price * bookSalesTotal[k].num) * (bookSalesTotal[k].royalty/100));
        
        for(genre of bookSalesTotal[k].genres){
          //Adds sales to this specific genre
          if(genre in sales.genres){
            sales.genres[genre] += (bookSalesTotal[k].price * bookSalesTotal[k].num);
          }
          else{
            sales.genres[genre] = (bookSalesTotal[k].price * bookSalesTotal[k].num);
          }

        }

        //Add sales to this specific author
        if(bookSalesTotal[k].author in sales.authors){
          sales.authors[bookSalesTotal[k].author] += (bookSalesTotal[k].price * bookSalesTotal[k].num);
        }
        else{
          sales.authors[bookSalesTotal[k].author] = (bookSalesTotal[k].price * bookSalesTotal[k].num);
        }

      }

      //Fill out values for last month
      for(k of keysMonth){
        sales.lastMonthIncome += (bookSalesMonth[k].price * bookSalesMonth[k].num);
        sales.lastMonthExpenses += ((bookSalesMonth[k].price * bookSalesMonth[k].num) * (bookSalesMonth[k].royalty/100));
      }

      //Formatting all sales values to 2 decimal places
      sales.income = sales.income.toFixed(2);
      sales.expenses = sales.expenses.toFixed(2);
      sales.lastMonthIncome = sales.lastMonthIncome.toFixed(2);
      sales.lastMonthExpenses = sales.lastMonthExpenses.toFixed(2);
      let fixedKey = Object.keys(sales.genres);
      for(genre of fixedKey){
        sales.genres[genre] = sales.genres[genre].toFixed(2);
      }
      fixedKey = Object.keys(sales.authors);
      for(author of fixedKey){
        sales.authors[author] = sales.authors[author].toFixed(2);
      }
      
      res.status(200);
      res.send(pug.renderFile("./views/sales.pug", {sales, user: req.session.user, loggedin: req.session.loggedin}));
    }
    catch(err){
      console.log(err);
      res.status(400);
      res.send("Sorry but there's an issue");
    }
  })();
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
        const newPublisher = await publisher.create({name: req.body.name, address: req.body.address, email: req.body.email, bankAccountNum: req.body.bankNum});
        var name = newPublisher.dataValues.name

        phoneNums = req.body.phoneNum;
        phoneNums = phoneNums.split(" ").join("").split(",");
      
        //Add pub phone numbers to db
        for (var i = 0; i < phoneNums.length; i++){
          try{
            await publisherPhoneNumber.create({name: name, phoneNum: phoneNums[i]});
          }
          catch(err){
            console.log(err);
            console.log("same phone number added twice - skipping second");
          }
        }

        res.status(201);
        res.send();
    } catch(err) {
        console.log(err);
        res.send(400);
        res.send("Something went wrong - Book probably already in db");
    }
  })();
};

//Adds to cart
function addToCart(req, res){
  (async() => {
    try {
      let username = req.session.user.username;
      let isbn = req.body.isbn;

      //Finds books trying to add to in db
      let result = await cart.findOne({where : {username, isbn}});
      let bookResult = await book.findOne({where : {isbn}});

      //Won't add if out of stock
      if(bookResult.stock<=0){
        res.status(404);
        res.send("Sorry, no more stock.");
        return;
      }

      //Adds to cart
      if (result) {
        await cart.update(
          { quantity: parseInt(result.quantity)+1 },
          { where: {username, isbn} }
        );
      } else {
        await cart.create({isbn: isbn, username: username, quantity: 1});
      }

      //Updates book stock
      await book.update(
        { stock: bookResult.stock-1 },
        { where: {isbn} }
      );

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
      let username = req.session.user.username;
      let isbn = req.body.isbn;

      //Update cart quantity
      let result = await cart.findOne({where : {username, isbn}});
      if (result.quantity>1) {
        await cart.update(
          { quantity: result.quantity-1 },
          { where: {username, isbn} }
        );
      } else {
        await cart.destroy({ where : {username, isbn} });
      }

      //Update book stock
      result = await book.findOne({where : {isbn}});
      await book.update(
        { stock: result.stock+1 },
        { where: {isbn} }
      );

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
      //Removes entry in book and bookGenre
      await book.destroy({where : {isbn : req.params.isbn}});
      await bookGenre.destroy({where : {isbn : req.params.isbn}});

      res.status(201);
      res.send("/books");
    }
    catch(err){
      console.log(err);
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

      //Gets the most recent order_num and inits other values for purchase insert
      const uniquePurchases = (await database.query("SELECT MAX(order_number) AS last_num FROM (SELECT distinct(order_number) FROM purchases) AS temp;", {type: Sequelize.SELECT}))[0][0].last_num;
      let newOrderNum = parseInt(uniquePurchases) + 1;
      let purchaseDate = new Date();
      let username = req.session.user.username;

      //finds all books in cart associated with user
      let purchasedBooks = await cart.findAll({where: {username}});
      for(boughtBook of purchasedBooks){
        let isbn = boughtBook.isbn;
        let quantity = boughtBook.quantity;
        //Inserts book as purchased and removes it from the cart
        await purchases.create({isbn, username, date: purchaseDate, order_number: newOrderNum, quantity});
        await cart.destroy({where: {username, isbn}});
      }

      res.status(200);
      res.send("/orders/" + newOrderNum);

    }
    catch(err){
      console.log(err);
      res.status(400);
      res.send("Sorry there was a problem on our end");
    }
  })();
}

//Connects server to http://localhost:3000/
app.listen(port, () => console.log(`app listening on port http://localhost:3000/`));