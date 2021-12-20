--Example of SQL trigger being used within our application
CREATE TRIGGER restock 
    AFTER INSERT ON purchases 
    FOR EACH ROW 
    EXECUTE PROCEDURE restock_books();