DROP TABLE IF EXISTS clients;

CREATE TABLE clients(
     rowId INT UNSIGNED NOT NULL AUTO_INCREMENT,
     clientId VARCHAR(15),
     clientName VARCHAR(256),
     clientNumber INT,
     INDEX (clientId),
     INDEX (clientName),
     INDEX (clientNumber)

);