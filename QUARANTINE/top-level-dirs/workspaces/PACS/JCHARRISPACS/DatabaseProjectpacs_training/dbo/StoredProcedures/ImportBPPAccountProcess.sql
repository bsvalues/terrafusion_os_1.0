
/*
 * This stored procedure will update the following tables:
 *		account (update file_as_name, email_addr only)
 *		address (update or insert)
 *		phone (update or insert)
 *
 * for the Account Update option of the Import BPP Rendtion process
 */

create procedure ImportBPPAccountProcess
	
	@run_id int,
	@pacs_user_id int
	
as

set nocount on

delete chg_log_user where machine = host_name()
exec SetChgLogUser -1
exec SetMachineLogChanges 1, @pacs_user_id

-- First exclude all records where there was an error for the Owner ID
declare @valid_ids_table table
(acct_id int, primary key (acct_id))

insert @valid_ids_table
(acct_id)
select distinct ibai.owner_id
from import_bpp_account_info as ibai
with (nolock)
where run_id = @run_id
and owner_id not in
(select prop_id
 from import_bpp_error
 with (nolock)
 where run_id = @run_id)

-- Next update the account table where a File As Name or Email address was specified
update account
set file_as_name = case when len(isnull(ibai.file_as_name,'')) > 0 then ibai.file_as_name else a.file_as_name end,
		email_addr = case when len(isnull(ibai.email,'')) > 0 then ibai.email else a.email_addr end
from account as a
join @valid_ids_table as v
on a.acct_id = v.acct_id
join import_bpp_account_info as ibai
with (nolock)
on a.acct_id = ibai.owner_id
where ibai.run_id = @run_id

-- Next update only the Primary Addresses if any were specified, overwriting any data with
-- what was imported
update address
set addr_line1 = ibai.address_1,
		addr_line2 = ibai.address_2,
		addr_line3 = ibai.address_3,
		addr_city = ibai.city,
		addr_state = ibai.state,
		zip = ibai.zip,
		cass = ibai.cass,
		country_cd = ibai.country_cd,
		chg_reason_cd = 'REND'
from address as a
join @valid_ids_table as v
on a.acct_id = v.acct_id
join import_bpp_account_info as ibai
with (nolock)
on a.acct_id = ibai.owner_id
and a.primary_addr = ibai.primary_address
where ibai.run_id = @run_id
and ibai.primary_address = 'Y'

-- Next add any new address records
insert address
(acct_id, addr_type_cd, primary_addr, addr_line1, addr_line2, addr_line3,
 addr_city, addr_state, country_cd, zip, cass, chg_reason_cd)

select ibai.owner_id, isnull(ibai.address_type, 'M'), ibai.primary_address, ibai.address_1, ibai.address_2, ibai.address_3,
				ibai.city, ibai.state, ibai.country_cd, ibai.zip, ibai.cass, 'REND'
from import_bpp_account_info as ibai
with (nolock)
join @valid_ids_table as v
on ibai.owner_id = v.acct_id
left outer join address as a
on ibai.owner_id = a.acct_id
and ibai.primary_address = a.primary_addr
and a.primary_addr = 'Y'
where ibai.run_id = @run_id
and ibai.primary_address is not null
and a.acct_id is null

-- Next update any existing phone records by type
update phone
set phone_num = ibai.phone_number
from phone as p
join @valid_ids_table as v
on p.acct_id = v.acct_id
join import_bpp_account_info as ibai
with (nolock)
on p.acct_id = ibai.owner_id
and p.phone_type_cd = ibai.phone_type
where ibai.run_id = @run_id
and ibai.phone_number is not null

-- Next add any new phone records where the Phone Type does not already exist for the Owner
insert phone
(acct_id, phone_id, phone_type_cd, phone_num)

select ibai.owner_id, 0, ibai.phone_type, ibai.phone_number
from import_bpp_account_info as ibai
with (nolock)
join @valid_ids_table as v
on ibai.owner_id = v.acct_id
left outer join phone as p
on ibai.owner_id = p.acct_id
and ibai.phone_type = p.phone_type_cd
where ibai.run_id = @run_id
and ibai.phone_number is not null
and p.acct_id is null

-- Lastly, update the Import run so it shows as Processed.

update import_bpp
set status = 'Processed',
		process_by_id = @pacs_user_id,
		process_date = getdate()
where run_id = @run_id

set ansi_nulls on
set quoted_identifier on

GO

