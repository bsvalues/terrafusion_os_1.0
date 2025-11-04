

CREATE view seller_assoc_vw
as
select  seller_id,   
        chg_of_owner_id,  
        prop_id,
        account.acct_id,
	first_name,                     
        last_name,                      
	file_as_name,                                                           
	dl_num,
	dl_state, 
	dl_expir_dt,                 
	merged_acct_id, 
	acct_create_dt,             
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
	confidential_flag
from
	seller_assoc
join
	account on account.acct_id = seller_assoc.seller_id
left outer join
	address on seller_assoc.seller_id = address.acct_id
left outer join
--	phone   on seller_assoc.seller_id = phone.acct_id (returns multiple phone numbers)
	one_phone_number_vw pn on pn.acct_id = seller_assoc.seller_id -- returns a single phone number (arbitrary at the moment, but will be primary)

GO

