

/****** Object:  View dbo.buyer_assoc_vw    Script Date: 1/3/99 9:45:19 PM ******/

/****** Object:  View dbo.buyer_assoc_vw    Script Date: 1/3/99 11:57:08 AM ******/
/****** Object:  View dbo.buyer_assoc_vw    Script Date: 12/21/98 5:34:26 PM ******/
CREATE view buyer_assoc_vw
as
select  buyer_id,   
        chg_of_owner_id,  
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
from buyer_assoc
join account on account.acct_id = buyer_assoc.buyer_id
left outer join address on buyer_assoc.buyer_id = address.acct_id
left outer join phone   on buyer_assoc.buyer_id = phone.acct_id

GO

