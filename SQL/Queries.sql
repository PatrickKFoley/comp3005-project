--Example of queries in our application. Most of these have some variable name from our code
SELECT order_number 
FROM purchases 
WHERE order_number LIKE '%" + orderNo + "%';

SELECT title, isbn 
FROM books 
WHERE isbn =  + isbns[0][i].isbn;

SELECT isbn, SUM(quantity) AS total_sold 
FROM purchases 
WHERE date>(CURRENT_DATE - INTERVAL '1 month') 
GROUP BY isbn;

SELECT MAX(order_number) AS last_num 
FROM (SELECT distinct(order_number) 
    FROM purchases)    
    AS temp;

SELECT books.isbn, name, title 
FROM publishes, books 
WHERE publishes.isbn = books.isbn AND name = '" + req.params.name + "';

SELECT distinct(order_number) 
FROM purchases;