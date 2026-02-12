

/****** Object:  View dbo.MORTGAGE_VW    Script Date: 12/21/98 5:34:19 PM ******/
CREATE VIEW MORTGAGE_VW
AS SELECT
       account.acct_id as account_acct_id,
       address.acct_id as address_acct_id,
       phone.acct_id  as phone_acct_id,
       first_name           ,
       last_name            ,
       file_as_name         ,
       merged_acct_id       ,
       ref_id1, 
       dl_num               ,
       dl_state             ,
       acct_create_dt       ,
       dl_expir_dt          ,
       opening_balance      ,
       addr_type_cd         ,
       primary_addr         ,
       addr_line1           ,
       addr_line2           ,
       addr_line3           ,
       addr_city            ,
       addr_state           ,
       country_cd           ,
       addr_zip             ,
       ml_returned_dt       ,
       ml_type_cd           ,
       ml_deliverable       ,
       ml_return_type_cd    ,
       ml_returned_reason   ,
       cass_dt              ,
       delivery_point       ,
       carrier_route        ,
       check_digit          ,
       update_flag          ,  
       phone_id             ,                               
       phone_type_cd        ,                                  
       phone_num            ,
		lender_num
from account
inner join mortgage_co
with (nolock)
on account.acct_id = mortgage_co.mortgage_co_id
LEFT OUTER JOIN address 
with (nolock)
on account.acct_id = address.acct_id
LEFT OUTER JOIN phone 
with (nolock)
on account.acct_id = phone.acct_id

GO

