CREATE TABLE "Order" (
	orderId varchar(100) primary key,
	value NUMERIC,
	creationDate TIMESTAMPTZ
);

CREATE TABLE Items (
	orderId VARCHAR(100),
	productId INTEGER,
	quantity INTEGER,
	price NUMERIC,
	FOREIGN KEY (orderId) REFERENCES "Order" (orderId)
);


SELECT * FROM "Order";
SELECT * FROM "items";





