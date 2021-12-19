//Sends query to log user in
function login(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if(!validInput(username)){
        alert("Username is invalid. Needs to be >2 characters");
        return;
    }
    if(!validInput(password)){
        alert("Password is invalid. Needs to be >2 characters");
        return;
    }

    let user = {
        username,
        password
    }
    //Send data to server
    let req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200){
            alert("Logged in successfully");
            location.href = this.responseText;
        }
        else if(this.readyState == 4 && this.status == 404){
            alert(this.responseText);
        }
    }

    req.open("POST", "http://localhost:3000/login");
    req.setRequestHeader("Content-Type", "application/json");
    let data = JSON.stringify(user);
    req.send(data);
}

//Sends query to create user in db
function createUser(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let email = document.getElementById("email").value;
    let address = document.getElementById("address").value;
    let name = document.getElementById("name").value;
    let owner = false;

    let user = {
        username,
        password,
        email,
        address,
        name,
        owner
    }

    //if a new user has an "owner" email, make them an owner
    if (email.slice(-10) == "@owner.com"){
        user.owner = true;
    }

    if(!validInput(username)){
        alert("Username is invalid. Needs to be >2 characters");
        return;
    }
    if(!validInput(password)){
        alert("Password is invalid. Needs to be >2 characters");
        return;
    }
    if(!validInput(email)){
        alert("Email is invalid. Needs to be >2 characters");
        return;
    }
    if(!validInput(address)){
        alert("Address is invalid. Needs to be >2 characters");
        return;
    }
    if(!validInput(name)){
        alert("Name is invalid. Needs to be >2 characters");
        return;
    }

    //Send data to server
    let req = new XMLHttpRequest();

	req.onreadystatechange = function() {
		if(this.readyState == 4 && this.status == 201){
			alert("User created successfully");
            location.href = this.responseText;
		}
        else if(this.readyState == 4 && this.status == 400){
            alert(this.responseText);
        }
	}
    
	req.open("POST", "http://localhost:3000/register");
	req.setRequestHeader("Content-Type", "application/json");
	let data = JSON.stringify(user);
	req.send(data);
}

//Returns whether the input string is valid
function validInput(input){
    if(input===""||input===undefined||input.length<3){
        return false;
    }
    return true;
}