

CREATE VIEW dbo.mortgage_prop_vw
AS
SELECT
	cpiv.prop_id, 
	cpiv.assessed_val, 
	cpiv.legal_desc, 
	cpiv.file_as_name AS owner_name, 
	cpiv.prop_type_cd, 
	cpiv.geo_id, 
	cpiv.addr_line1, 
	cpiv.addr_line2, 
	cpiv.addr_line3, 
	cpiv.addr_city, 
	cpiv.addr_state, 
	cpiv.addr_zip, 
	account.acct_id AS mortgage_company_id, 
	account.file_as_name AS mortgage_company, 
	mortgage_assoc.mortgage_acct_id, account.ref_id1
FROM
	CURR_PROP_INFO_VW_NOFREEZE cpiv
INNER JOIN
	mortgage_assoc ON cpiv.prop_id = mortgage_assoc.prop_id
INNER JOIN
	account ON mortgage_assoc.mortgage_co_id = account.acct_id

GO

