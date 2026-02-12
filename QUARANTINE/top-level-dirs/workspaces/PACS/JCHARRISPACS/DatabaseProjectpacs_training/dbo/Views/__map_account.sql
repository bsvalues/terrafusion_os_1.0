create view  __map_account as

SELECT DISTINCT  
acct_id, 
REPLACE(REPLACE(file_as_name, CHAR(13), ''),CHAR(10), ' ') 	
as file_as_name FROM account

GO

