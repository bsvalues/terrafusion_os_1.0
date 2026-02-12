

CREATE VIEW dbo.primary_address_vw
AS
SELECT 
	primary_addr AS Expr1, 
	acct_id,
	addr_type_cd,
	primary_addr,
	addr_line1,
	addr_line2,
	addr_line3,
	addr_city,
	addr_state,
	country_cd,
	ml_returned_dt,
	ml_type_cd,
	ml_deliverable,
	ml_return_type_cd,
	ml_returned_reason,
	cass_dt,
	delivery_point,
	carrier_route,
	check_digit,
	update_flag,
	chg_reason_cd,
	last_change_dt,
	zip,
	cass,
	route,
	addr_zip,
	zip_4_2,
	is_international
FROM address
WHERE (primary_addr = 'Y')

GO

