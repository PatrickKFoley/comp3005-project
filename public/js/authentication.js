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
    let user = {
        username,
        password
    }

    if(!validInput(username)){
        alert("Username is invalid. Needs to be >2 characters");
        return;
    }
    if(!validInput(password)){
        alert("Password is invalid. Needs to be >2 characters");
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