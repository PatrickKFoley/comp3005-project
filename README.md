# Book Store
instructions for running:

(please ensure that postgres and npm are up to date)

creating postgre database:
	in pgAdmin, create a new server with:
		name: postgres
		host/name address: localhost
		port: 5432
		password: password
	running the database initalizer will create all tables and populate them with some sample data
	(as long as you have postgres installed you may have a database pre-built that will work with this project)

running the server:
	in a terminal, navigate to the proper directory and enter the command "npm install"
	enter "node .\db-initializer.js" - this might take a few seconds to complete
	enter "node .\server.js" - once you see "connection has been established successfully" you are good to go

getting to the server:
	enter the url "localhost:3000" in your search engine and you should find the landing of the website
