














/****** Object:  View dbo.AGENT_VW    Script Date: 12/21/98 5:34:18 PM ******/
CREATE VIEW AGENT_VW
AS SELECT
	account.acct_id acct_acct_id ,
	address.acct_id address_acct_id,
	phone.acct_id   phone_acct_id,
	first_name,
	dl_num,
	last_name,
	file_as_name,
	merged_acct_id,
	ref_id1,   
	dl_state,
	acct_create_dt,
	dl_expir_dt,
	opening_balance,
	addr_type_cd,
	primary_addr,
	addr_line1,
	addr_line2,
	addr_line3,
	addr_city,
	addr_state,
	country_cd,
	addr_zip,
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
	phone_id,
	phone_type_cd,
	phone_num,
	inactive_flag 
from agent
INNER JOIN account on agent.agent_id = account.acct_id
LEFT OUTER JOIN address on account.acct_id = address.acct_id
LEFT OUTER JOIN phone on account.acct_id = phone.acct_id

GO

