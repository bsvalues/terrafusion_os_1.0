create view  __map_address as 

SELECT 
[acct_id],
[addr_line1],
[addr_line2],
[addr_line3],
[addr_city],
[addr_state],
[zip] 
FROM 
[pacs_oltp].[dbo].[address] 
WHERE primary_addr = 'Y'

GO

