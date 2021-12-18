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
            alert(this.responseText);
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

    req.open("PUT", "http://localhost:3000/carts/" + isbn);
    req.setRequestHeader("Content-Type", "application/json");
    let data = JSON.stringify(book);
    req.send(data);
}

//Sends request to server to add book to db
function addBook(){
    let title = document.getElementById("title").value;
    let author = document.getElementById("author").value;
    let isbn = document.getElementById("isbn").value;
    let pageCount = document.getElementById("num_pages").value;
    let stock = document.getElementById("stock").value;
    let price = document.getElementById("price").value;

    let book = {
        title,
        author,
        isbn,
        pageCount,
        stock,
        price
    };

    //Send data to server
    let req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 201){
			alert("Book Created Successfully");
            location.href = this.responseText;
		}
        else if(this.readyState == 4 && this.status == 400){
            alert(this.responseText);
        }
	}

	req.open("PUT", "http://localhost:3000/books/"+isbn);
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
			alert("Publisher Added Successfully");
            location.href = this.responseText;
		}
        else if(this.readyState == 4 && this.status == 400){
            alert(this.responseText);
        }
	}

	req.open("PUT", "http://localhost:3000/publisher/"+name);
	req.setRequestHeader("Content-Type", "application/json");
	let data = JSON.stringify(publisher);
	req.send(data);
}

//Sends request to server to return books that match query
function searchBooks(){
    let title = document.getElementById("book").value;

    let req = new XMLHttpRequest();
	
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200){
            let results = document.getElementById("books");
            results.innerHTML = this.responseText;
        }
    }

    req.open("GET", "http://localhost:3000/books?title=" + title + "&num=1");
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

	req.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 201){
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