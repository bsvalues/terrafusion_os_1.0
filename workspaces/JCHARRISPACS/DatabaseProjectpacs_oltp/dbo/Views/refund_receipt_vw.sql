
CREATE VIEW [dbo].[refund_receipt_vw]
AS
SELECT     refund_id,
(SELECT     TOP (1) 
	CASE WHEN isnull(addr_line1, '') <> '' THEN addr_line1 + char(13) ELSE '' END + 
	CASE WHEN isnull(addr_line2, '') <> '' THEN addr_line2 + char(13) ELSE '' END + 
	CASE WHEN isnull(addr_line3, '') <> '' THEN addr_line3 + char(13) ELSE '' END + 
	CASE WHEN isnull(city, '') <> '' THEN city + ',' ELSE '' END + 
	ISNULL(state, '') + 
	ISNULL(zip, '') AS Expr1
FROM          dbo.system_address
WHERE      (system_type = 'C')) AS system_address, 

CASE WHEN isnull(refund_to_name, '') <> '' THEN refund_to_name + char(13) ELSE '' END + 
CASE WHEN isnull(refund_to_address1, '') <> '' THEN refund_to_address1 + char(13) ELSE '' END + 
CASE WHEN isnull(refund_to_address2, '') <> '' THEN refund_to_address2 + char(13) ELSE '' END + 
CASE WHEN isnull(refund_to_address3, '') <> '' THEN refund_to_address3 + char(13) ELSE '' END + 
CASE WHEN isnull(refund_to_city, '') <> '' THEN refund_to_city + ',' ELSE '' END + 
ISNULL(refund_to_state, '') + ' ' + 
ISNULL(refund_to_zip, '') + ' ' + 
ISNULL(refund_to_country_cd, '') 
AS address, CASE WHEN EXISTS

(SELECT 1 FROM mortgage_co WHERE mortgage_co_id = account_id) THEN account_id ELSE NULL END AS mortgage_id, 
check_number, 
refund_amount

FROM
dbo.refund

GO

