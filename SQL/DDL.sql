-- Examples of DDL used throughout our application
DROP TABLE IF EXISTS "books" CASCADE;
CREATE TABLE IF NOT EXISTS "books" (
    "isbn" BIGINT NOT NULL , 
    "title" VARCHAR(255) NOT NULL, 
    "author" VARCHAR(255) NOT NULL, 
    "numPages" INTEGER NOT NULL, 
    "stock" INTEGER NOT NULL, 
    "price" DOUBLE PRECISION NOT NULL, 
    "royalty" DOUBLE PRECISION NOT NULL, 
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY ("isbn")
);

DROP TABLE IF EXISTS "bookgenres" CASCADE;
CREATE TABLE IF NOT EXISTS "bookgenres" (
    "isbn" BIGINT NOT NULL , 
    "genre" VARCHAR(255) NOT NULL , 
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY ("isbn","genre")
);

DROP TABLE IF EXISTS "publishes" CASCADE;
CREATE TABLE IF NOT EXISTS "publishes" (
    "isbn" BIGINT NOT NULL  REFERENCES "books" ("isbn") ON DELETE CASCADE ON UPDATE CASCADE, 
    "name" VARCHAR(255) NOT NULL  REFERENCES "publishers" ("name") ON DELETE CASCADE ON UPDATE CASCADE, 
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY ("isbn","name")
);