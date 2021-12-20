--Example of SQL function being declared in our application
CREATE OR REPLACE FUNCTION restock_books() 
RETURNS trigger as $stamp$ 
BEGIN 
    UPDATE books 
    SET stock=subquery.total 
    FROM 
        (SELECT SUM(quantity) AS total 
        FROM purchases 
        WHERE date>(CURRENT_DATE - INTERVAL '1 month') and isbn=NEW.isbn) 
        AS subquery 
    WHERE isbn=NEW.isbn AND stock=0; 
    RETURN NEW; 
END; 
$stamp$ LANGUAGE plpgsql