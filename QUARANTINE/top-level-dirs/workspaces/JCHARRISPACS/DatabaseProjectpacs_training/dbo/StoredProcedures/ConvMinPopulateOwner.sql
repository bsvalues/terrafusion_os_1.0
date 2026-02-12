

Create procedure ConvMinPopulateOwner 

as


	update account set file_as_name   = mineral_owner_cv.file_as_name,
			   ref_id1        = mineral_owner_cv.owner_no,
			   source         = mineral_owner_cv.source,
			   acct_create_dt = mineral_owner_cv.acct_create_dt
	from mineral_owner_cv
	where account.acct_id = mineral_owner_cv.acct_id
	
	insert into account
	(
	acct_id,
	file_as_name,
	ref_id1,
	source,
	acct_create_dt
	)
	select acct_id,
		file_as_name,
		owner_no,
		source,
		acct_create_dt
	from mineral_owner_cv
	where not exists (select * from account where account.acct_id = mineral_owner_cv.acct_id)


	update address set addr_line1 = mineral_owner_cv.addr_line1,
			   addr_line2 = mineral_owner_cv.addr_line2,
			   addr_line3 = mineral_owner_cv.addr_line3,
			   addr_city  = mineral_owner_cv.addr_city,
			   addr_state    = mineral_owner_cv.addr_st,
			   zip   = mineral_owner_cv.addr_zip
	from mineral_owner_cv
	where address.acct_id = mineral_owner_cv.acct_id
	and   address.primary_addr = 'Y'
	
	insert into address
	(
	acct_id,
	addr_type_cd,
	primary_addr,
	addr_line1, 
	addr_line2, 
	addr_line3, 
	addr_city, 
	addr_state, 
	zip 
	)
	select  acct_id,
		'M',
		'Y',
		addr_line1,
		addr_line2,
		addr_line3,
		addr_city,
		addr_st,
		addr_zip
	from mineral_owner_cv
	where  not exists (select * from address where address.acct_id = mineral_owner_cv.acct_id)

GO

