//Sends request to server to remove book from cart
function removeFromCart(clicked_id){
    console.log(clicked_id);
    let isbn = clicked_id;
    let book = {
        isbn,
        add : false
    };

    //Send data to server
    let req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 201){
            location.href = this.responseText;
        }
        else if(this.readyState == 4 && this.status == 404 || this.status == 400){
            alert(this.responseText);
        }
    }

    req.open("PUT", "http://localhost:3000/carts/" + isbn);
    req.setRequestHeader("Content-Type", "application/json");
    let data = JSON.stringify(book);
    req.send(data);
}

//Sends request to add book to cart
function addToCart(clicked_id){
    console.log(clicked_id);
    let isbn = clicked_id;
    let book = {
        isbn,
        add : true
    };

    //Send data to server
    let req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 201){
            alert(this.responseText);
        }
        else if(this.readyState == 4 && this.status == 404 || this.status == 400){
            alert(this.responseText);
        }
    }

    req.open("POST", "http://localhost:3000/carts");
    req.setRequestHeader("Content-Type", "application/json");
    let data = JSON.stringify(book);
    req.send(data);
}

//Sends request to server to add book to db
function addBook(){
    let title = document.getElementById("title").value;
    let author = document.getElementById("author").value;
    let isbn = document.getElementById("isbn").value;
    let numPages = document.getElementById("num_pages").value;
    let stock = document.getElementById("stock").value;
    let price = document.getElementById("price").value;
    let genres = document.getElementById("genres").value;
    let publisher = document.getElementById("publisher").value;
    let royalty = document.getElementById("royalty").value;

    let book = {
        title,
        author,
        isbn,
        numPages,
        stock,
        price,
        genres,
        publisher,
        royalty
    };

    if(!validInput(title)){
        alert("Title is invalid. Needs to be >2 characters");
    }
    if(!validInput(author)){
        alert("Author is invalid. Needs to be >2 characters");
    }
    if(!validNumber(isbn)){
        alert("isbn is invalid. Needs to be a number");
        return;
    }
    if(!validNumber(numPages)){
        alert("Page count is invalid. Needs to be a number");
        return;
    }
    if(!validNumber(stock)){
        alert("Stock is invalid. Needs to be a number");
        return;
    }
    if(!validNumber(price)){
        alert("price is invalid. Needs to be a number");
        return;
    }
    if(!validInput(publisher)){
        alert("Publisher is invalid. Needs to be >2 characters");
    }
    if(!validInput(genres)){
        alert("Genres is invalid. Needs to be >2 characters");
    }
    if(!validNumber(royalty)){
        alert("royalty is invalid. Needs to be a number");
        return;
    }

    //Send data to server
    let req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 201){
            location.href = "/books/" + isbn
		}
        else if(this.readyState == 4 && this.status == 400){
            alert(this.responseText);
        }
	}

	req.open("POST", "http://localhost:3000/books");
	req.setRequestHeader("Content-Type", "application/json");
	let data = JSON.stringify(book);
	req.send(data);
}

//Sends request to server to add book to db
function addPublisher(){
    let name = document.getElementById("name").value;
    let address = document.getElementById("address").value;
    let email = document.getElementById("email").value;
    let bankNum = document.getElementById("bankNum").value;
    let phoneNum = document.getElementById("phoneNum").value;
    
    let publisher = {
        name,
        address,
        email,
        bankNum,
        phoneNum,
    };

    //Send data to server
    let req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 201){
            location.href = "/publishers/" + name
		}
        else if(this.readyState == 4 && this.status == 400){
            alert(this.responseText);
        }
	}

	req.open("POST", "http://localhost:3000/publishers");
	req.setRequestHeader("Content-Type", "application/json");
	let data = JSON.stringify(publisher);
	req.send(data);
}

//Sends request to server to return books that match query
function searchBooks(){
    let search = document.getElementById("book").value;
    let option = document.getElementById("dropdown").value;

    let req = new XMLHttpRequest();
	
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200){
            let results = document.getElementById("books");
            results.innerHTML = this.responseText;
        }
    }

    req.open("GET", "http://localhost:3000/books?search=" + search + "&option=" + option + "&num=1");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}

//Sends request to server to return orders that match query
function searchOrders(){
    let orderNo = document.getElementById("order").value;

    let req = new XMLHttpRequest();
	
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200){
            let results = document.getElementById("orders");
            results.innerHTML = this.responseText;
        }
    }

    req.open("GET", "http://localhost:3000/orders?orderNo=" + orderNo + "&num=1");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}

function searchPublishers(){
    let name = document.getElementById("name").value;

    let req = new XMLHttpRequest();
	
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200){
            let results = document.getElementById("names");
            results.innerHTML = this.responseText;
        }
    }

    req.open("GET", "http://localhost:3000/publishers?name=" + name + "&num=1");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}

//Completes order and sends confirmation to server
function completeOrder(){
    //Purposefully empty json because server will use session.username to query
    let empty = {};
    //Send data to server
    let req = new XMLHttpRequest();
    console.log("Here");
	req.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 200){
			alert("Your order has been placed!");
            location.href = this.responseText;
		}
        else if(this.readyState == 4 && this.status == 400){
            alert(this.responseText);
        }
	}

	req.open("POST", "http://localhost:3000/orders");
	req.setRequestHeader("Content-Type", "application/json");
	let data = JSON.stringify(empty);
	req.send(data);
}

function removeFromStore(clicked_id){
        //Purposefully empty json because server will use session.username to query
        let empty = {};
        //Send data to server
        let req = new XMLHttpRequest();
    
        req.onreadystatechange = function() {
            if(this.readyState == 4 && this.status == 201){
                alert("This book has been removed!");
                location.href = this.responseText;
            }
            else if(this.readyState == 4 && this.status == 404){
                alert(this.responseText);
            }
        }
    
        req.open("PUT", "http://localhost:3000/books/"+clicked_id);
        req.setRequestHeader("Content-Type", "application/json");
        let data = JSON.stringify(empty);
        req.send(data);
}

//Returns whether the input string is valid
function validInput(input){
    if(input===""||input===undefined||input.length<3){
        return false;
    }
    return true;
}

//Returns if valid number
function validNumber(input){
    if(parseFloat()==NaN){
        return false;
    }
    return true;
}