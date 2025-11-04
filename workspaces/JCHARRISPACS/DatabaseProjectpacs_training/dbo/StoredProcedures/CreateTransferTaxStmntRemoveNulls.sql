




CREATE procedure CreateTransferTaxStmntRemoveNulls

@input_group_id	int,
@input_run_id		int,
@input_stmnt_yr		numeric(4),
@input_sup_num	int


as



/* remove any nulls */
update transfer_tax_stmnt 
set 	geo_id = IsNull(geo_id,  ' ') ,
      	sa_addr_line1 = IsNull(sa_addr_line1,  ' ') ,
	sa_addr_line2 = IsNull(sa_addr_line2  , ' '),
	sa_addr_line3 = IsNull(sa_addr_line3  , ' '),
	sa_city      = IsNull(sa_city  , ' ') ,
	sa_state     = IsNull(sa_state  , ' ') ,
	sa_zip       = IsNull(sa_zip  , ' ') ,
	sa_phone       = IsNull(sa_phone , ' ') ,
	sa_fax       = IsNull(sa_fax , ' ') ,
	owner_name = IsNull(owner_name  , ' ') ,
	owner_addr_line1   = IsNull(owner_addr_line1 , ' '),
	owner_addr_line2   = IsNull(owner_addr_line2  , ' '),
	owner_addr_line3   = IsNull(owner_addr_line3   , ' '),
	owner_addr_city    = IsNull(owner_addr_city  , ' '),
	owner_addr_state   = IsNull(owner_addr_state  , ' '),
	owner_addr_zip     = IsNull(owner_addr_zip   , ' ') ,
	owner_addr_country = IsNull(owner_addr_country  , ' ') ,
	owner_addr_deliverable = IsNull(owner_addr_deliverable, 'Y') ,
	mail_to_name = IsNull(mail_to_name  , ' '),
	mail_to_addr_line1   = IsNull(mail_to_addr_line1  , ' ') ,
	mail_to_addr_line2   = IsNull(mail_to_addr_line2  , ' '),
	mail_to_addr_line3   = IsNull(mail_to_addr_line3  , ' ') ,
	mail_to_addr_city    = IsNull(mail_to_addr_city  , ' ') ,
	mail_to_addr_state   = IsNull(mail_to_addr_state  , ' ') ,
	mail_to_addr_zip     = IsNull(mail_to_addr_zip  , ' ') ,
	mail_to_addr_country = IsNull(mail_to_addr_country  , ' ') ,
	mail_to_addr_deliverable = IsNull(mail_to_addr_deliverable, 'Y') ,
	legal_desc   = IsNull(legal_desc  , ' ') ,
	legal_acreage = IsNull(legal_acreage, 0),
	primary_situs      = IsNull(primary_situs, ' ') ,
	situs_num          = IsNull(situs_num, ' ') ,
	situs_street_prefx = IsNull(situs_street_prefx, ' ') ,
	situs_street       = IsNull(situs_street,  ' ') ,
	situs_street_sufix = IsNull(situs_street_sufix, ' ') ,
	situs_unit         = IsNull(situs_unit, ' ') ,
	situs_city         = IsNull(situs_city, ' ') ,
	situs_state        = IsNull(situs_state, ' ') ,
	situs_zip          = IsNull(situs_zip, ' ') ,
	situs_display      = IsNull(situs_display, ' ') ,
	imprv_hstd_val = IsNull(imprv_hstd_val  , 0),
	imprv_non_hstd_val = IsNull(imprv_non_hstd_val  , 0) ,
	land_hstd_val = IsNull(land_hstd_val  , 0) ,
	land_non_hstd_val = IsNull(land_non_hstd_val  , 0) ,
	ag_market = IsNull(ag_market  , 0) 	,
	ag_use = IsNull(ag_use  , 0) ,
	tim_market = IsNull(tim_market  , 0) 	,
	tim_use    = IsNull(tim_use  , 0) 	,
	ten_percent_cap = IsNull(ten_percent_cap  , 0) 	,
	assessed_val = IsNull(assessed_val  , 0) 	,
	appraised_val = IsNull(appraised_val  , 0) ,
	pct_ownership = IsNull(pct_ownership, 100),
	vit_flag = IsNull(vit_flag, 'F'),
	exemptions = IsNull(exemptions, ''),
	mortgage_acct = IsNull(mortgage_acct , ' ')
	

where  transfer_tax_stmnt.levy_group_id = @input_group_id
and   transfer_tax_stmnt.levy_group_yr = @input_stmnt_yr
and   transfer_tax_stmnt.levy_run_id   = @input_run_id

update transfer_tax_stmnt set mail_to_name = account.confidential_file_as_name 
from account
where  transfer_tax_stmnt.levy_group_id = @input_group_id
and   transfer_tax_stmnt.levy_group_yr = @input_stmnt_yr
and   transfer_tax_stmnt.levy_run_id   = @input_run_id
and   account.acct_id = transfer_tax_stmnt.mail_to_id
and   account.confidential_flag = 'T'


update transfer_tax_stmnt set owner_name = account.confidential_file_as_name 
from account
where  transfer_tax_stmnt.levy_group_id = @input_group_id
and   transfer_tax_stmnt.levy_group_yr = @input_stmnt_yr
and   transfer_tax_stmnt.levy_run_id   = @input_run_id
and   account.acct_id = transfer_tax_stmnt.owner_id
and   account.confidential_flag = 'T'

GO

