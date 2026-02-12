
CREATE PROCEDURE ConvAppraisalPopulateOwner

as

--Update the accounts that have changes
update account set file_as_name   = collections_owner_cv.file_as_name,
		   ref_id1        = collections_owner_cv.owner_no,
		   source         = collections_owner_cv.source,
		   acct_create_dt = collections_owner_cv.acct_create_dt
from 	collections_owner_cv
where 	account.acct_id = collections_owner_cv.acct_id
	
--Create new accounts
insert into account
(
acct_id,
file_as_name,
ref_id1,
source,
acct_create_dt
)
select 	acct_id,
	file_as_name,
	owner_no,
	source,
	acct_create_dt
from 	collections_owner_cv
where not exists (select * from account where account.acct_id = collections_owner_cv.acct_id)


--Update the owner address'
update address set addr_line1 = collections_owner_cv.addr_line1,
		   addr_line2 = collections_owner_cv.addr_line2,
		   addr_line3 = collections_owner_cv.addr_line3,
		   addr_city  = collections_owner_cv.addr_city,
		   addr_state = collections_owner_cv.addr_st,
		   zip   = collections_owner_cv.addr_zip
from collections_owner_cv
where address.acct_id = collections_owner_cv.acct_id
and   address.primary_addr = 'Y'

--Add the new address'	
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
from collections_owner_cv
where  not exists (select * from address where address.acct_id = collections_owner_cv.acct_id)

GO

