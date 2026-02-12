
CREATE procedure UpdateMineralOwner

as

declare @acct_id     		int
declare @first_name             varchar(30)        
declare @last_name              varchar(30)
declare @file_as_name           varchar(70)                                       
declare @dl_num     		varchar(10)
declare @dl_state		varchar(2) 
declare @dl_expir_dt            datetime
declare @merged_acct_id		char(5) 
declare @acct_create_dt         datetime
declare @comment                varchar(1000)                                                                                                                                                                                                                                          
declare @misc_code              varchar(50)                     
declare @ref_id1                varchar(50)                  
declare @source    		varchar(30) 

declare @next_acct_id		int

select @next_acct_id = next_account_id
from next_account_id


select @next_acct_id = @next_acct_id + 1000



DECLARE ACCOUNT_CURSOR SCROLL CURSOR
    FOR select
	acct_id,     
	first_name,                     
	last_name,                      
	file_as_name,                                                           
	dl_num,     
	dl_state, 
	dl_expir_dt,                 
	merged_acct_id, 
	acct_create_dt,       
	comment,                                                                                                                                                                                                                                                          
	misc_code,                                          
	ref_id1,                                            
	source        
    from account where acct_id >= 60421 and acct_id <= 60566

open account_cursor
fetch next from account_cursor into  @acct_id,     
	@first_name,                     
	@last_name,                      
	@file_as_name,                                                           
	@dl_num,     
	@dl_state, 
	@dl_expir_dt,                 
	@merged_acct_id, 
	@acct_create_dt,       
	@comment,                                                                                                                                                                                                                                                          
	@misc_code,                                          
	@ref_id1,                                            
	@source      

while (@@FETCH_STATUS = 0)
begin
	/* copy the selected accounts to new accounts */
	insert into account
	(
	acct_id,     
	first_name,                     
	last_name,                      
	file_as_name,                                                           
	dl_num,     
	dl_state, 
	dl_expir_dt,                 
	merged_acct_id, 
	acct_create_dt,       
	comment,                                                                                                                                                                                                                                                          
	misc_code,                                          
	ref_id1,                                            
	source,
	ref_acct_id    
	)
	values
	(
	@next_acct_id,     
	@first_name,                     
	@last_name,                      
	@file_as_name,                                                           
	@dl_num,     
	@dl_state, 
	@dl_expir_dt,                 
	@merged_acct_id, 
	@acct_create_dt,       
	@comment,                                                                                                                                                                                                                                                          
	@misc_code,                                          
	@ref_id1,                                            
	' ',
	@acct_id
	)




	insert into address
	(
	acct_id ,    
	addr_type_cd, 
	primary_addr, 
	addr_line1 ,                                                  
	addr_line2,                                                   
	addr_line3,                                                   
	addr_city ,                                         
	addr_state ,                                        
	country_cd ,
	ml_returned_dt ,             
	ml_type_cd ,
	ml_deliverable,
	ml_return_type_cd ,
	ml_returned_reason ,                                
	cass_dt,                     
	delivery_point ,
	carrier_route ,
	check_digit ,
	update_flag ,
	chg_reason_cd,
	zip
	)
	select @next_acct_id ,    
	addr_type_cd, 
	primary_addr, 
	addr_line1 ,                                                  
	addr_line2,                                                   
	addr_line3,                                                   
	addr_city ,                                         
	addr_state ,                                        
	country_cd ,
	ml_returned_dt ,             
	ml_type_cd ,
	ml_deliverable,
	ml_return_type_cd ,
	ml_returned_reason ,                                
	cass_dt,                     
	delivery_point ,
	carrier_route ,
	check_digit ,
	update_flag ,
	chg_reason_cd,
	zip
	from address where acct_id = @acct_id

	/* copy old account information back */
	update account
	set   file_as_name   = mineral_owner_cv.file_as_name,  
	      source         = mineral_owner_cv.source,
	      acct_create_dt = mineral_owner_cv.acct_create_dt,
	      dl_num = ' ',     
	      dl_state = ' ', 
	      dl_expir_dt = ' ',                 
	      merged_acct_id = ' ', 
	      comment = ' ',                                                                                                                                                                                                                                                          
	      misc_code = ' ',                                          
	      ref_id1 = ' ',                                            
	      ref_acct_id   = @next_acct_id
	from mineral_owner_cv
	where account.acct_id = mineral_owner_cv.acct_id
	and   account.acct_id = @acct_id

	update address set  	addr_line1 = mineral_owner_cv.addr_line1,                                                  
			   	addr_line2 = mineral_owner_cv.addr_line2,                                                   
				addr_line3 = mineral_owner_cv.addr_line3,                                                   
				addr_city  = mineral_owner_cv.addr_city,                                         
				addr_state = mineral_owner_cv.addr_st,                                        
				country_cd = ' ',
				zip   = mineral_owner_cv.addr_zip,                                          
				ml_returned_dt = ' ',             
				ml_type_cd = ' ',
				ml_deliverable = ' ',
				ml_return_type_cd  = ' ',
				ml_returned_reason = ' ',                                
				cass_dt        = ' ',                     
				delivery_point = ' ',
				carrier_route  = ' ',
				check_digit    = ' ',
				update_flag    = ' ',
				chg_reason_cd  = ' ' 
	from address, mineral_owner_cv
	where address.acct_id = mineral_owner_cv.acct_id
	and   address.acct_id = @acct_id


	select @next_acct_id = @next_acct_id + 1


	fetch next from account_cursor into  @acct_id,     
					     @first_name,                     
					     @last_name,                      
					     @file_as_name,                                                           
					     @dl_num,     
					     @dl_state, 
					     @dl_expir_dt,                 
					     @merged_acct_id, 
					     @acct_create_dt,       
					     @comment,                                                                                                                                                                                                                                                          
					     @misc_code,                                          
					     @ref_id1,                                            
					     @source  
    
end

close account_cursor
deallocate account_cursor

update next_account_id set next_account_id = @next_acct_id

GO

