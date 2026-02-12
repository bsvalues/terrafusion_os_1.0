


CREATE   procedure UpdateApprNoticePropList

@input_notice_yr	numeric(4),
@input_notice_num	int

as

declare @real_option		char(1)
declare @personal_option   	char(1)
declare @mineral_option		char(1)
declare @mobile_option		char(1)
declare @auto_option		char(1)
declare @shared_prop_option  	char(1)


-- delete reference properties
delete
	appr_notice_prop_list 
from
	appr_notice_prop_list as anpl with(tablock)
inner join
	property as p with(nolock)
on
	p.prop_id = anpl.prop_id
and	p.reference_flag = 'T'
inner join
	property_val as pv with(nolock)
on
	pv.prop_id = anpl.prop_id
and	pv.prop_val_yr = anpl.notice_yr
and	pv.sup_num = anpl.sup_num
and	pv.prop_inactive_dt is not null
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num


-- store current values
update
	appr_notice_prop_list
set 
	an_assessed_val = property_val.assessed_val,
	an_market_val = property_val.market,
	an_appraised_val = property_val.appraised_val,
	an_imprv_hstd_val = property_val.imprv_hstd_val,
	an_imprv_non_hstd_val = property_val.imprv_non_hstd_val,
	an_land_hstd_val = property_val.land_hstd_val,
	an_land_non_hstd_val = property_val.land_non_hstd_val,
	an_ag_land_mkt_val = property_val.ag_market,
	an_ag_land_use_val = property_val.ag_use_val,
	legal_desc = replace(property_val.legal_desc, char(13) + char(10), ' '),
	legal_desc_2 = replace(property_val.legal_desc_2, char(13) + char(10), ' '),
	legal_acreage = property_val.legal_acreage,
	an_ten_percent_cap = property_val.ten_percent_cap,
	an_ag_market = property_val.ag_market,
	an_timber_market = property_val.timber_market,
	an_timber_use = property_val.timber_use,
	timber_78 = property_val.timber_78
from
	property_val
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	property_val.prop_id = appr_notice_prop_list.prop_id
and	property_val.sup_num = appr_notice_prop_list.sup_num
and	property_val.prop_val_yr = appr_notice_prop_list.sup_yr


--store the previous value information
update
	appr_notice_prop_list
set 
	an_prev_assessed_val = property_val.assessed_val,
	an_prev_market_val = property_val.market,
	an_prev_appraised_val = property_val.appraised_val,
	an_prev_imprv_hstd_val = property_val.imprv_hstd_val,
	an_prev_imprv_non_hstd_val = property_val.imprv_non_hstd_val,
	an_prev_land_hstd_val = property_val.land_hstd_val,
	an_prev_land_non_hstd_val = property_val.land_non_hstd_val,
	an_prev_ag_land_mkt_val = property_val.ag_market,
	an_prev_ag_land_use_val = property_val.ag_use_val,
	an_prev_yr = property_val.prop_val_yr,
	an_prev_ten_percent_cap = property_val.ten_percent_cap,
	an_prev_ag_market_val = property_val.ag_market,
	an_prev_timber_market_val = property_val.timber_market,
	an_prev_timber_use = property_val.timber_use
from
	property_val,
	prop_supp_assoc
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	prop_supp_assoc.prop_id = appr_notice_prop_list.prop_id
and	prop_supp_assoc.owner_tax_yr = (appr_notice_prop_list.sup_yr-1)
and	prop_supp_assoc.prop_id = property_val.prop_id
and	prop_supp_assoc.sup_num = property_val.sup_num
and	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr


-- store the assessed value from 5 years ago
update
	appr_notice_prop_list
set
	an_5yr = prop_supp_assoc.owner_tax_yr,
	an_5yr_assessed_val = property_val.assessed_val
from
	property_val,
	prop_supp_assoc
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	prop_supp_assoc.prop_id = appr_notice_prop_list.prop_id
and	prop_supp_assoc.owner_tax_yr = (appr_notice_prop_list.sup_yr - 5)
and	prop_supp_assoc.prop_id = property_val.prop_id
and	prop_supp_assoc.sup_num = property_val.sup_num
and	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr


-- calculate the change in assessed value over the 5 year period
update
	appr_notice_prop_list
set
	an_5yr_assessed_val_pct_change =
		case
			when an_5yr_assessed_val = 0 then 0.00
			else convert(numeric(16,2), (((an_assessed_val - an_5yr_assessed_val) / an_5yr_assessed_val) * 100))
		end
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_5yr_assessed_val is not null
and	appr_notice_prop_list.an_assessed_val is not null	
	

-- apply the percentage of ownership to the current year values
update
	appr_notice_prop_list
set 
/*
	an_assessed_val = an_assessed_val -- * (owner.pct_ownership/100), 
	an_market_val = an_market_val -- * (owner.pct_ownership/100),
	an_appraised_val = an_appraised_val -- * (owner.pct_ownership/100),
	an_imprv_hstd_val = an_imprv_hstd_val -- * (owner.pct_ownership/100),
	an_imprv_non_hstd_val = an_imprv_non_hstd_val -- * (owner.pct_ownership/100),
	an_land_hstd_val = an_land_hstd_val -- * (owner.pct_ownership/100),
	an_land_non_hstd_val = an_land_non_hstd_val -- * (owner.pct_ownership/100),
	an_ag_land_mkt_val = an_ag_land_mkt_val -- * (owner.pct_ownership/100),
	an_ag_land_use_val = an_ag_land_use_val -- * (owner.pct_ownership/100),
	an_ten_percent_cap = an_ten_percent_cap -- * (owner.pct_ownership/100),
	an_ag_market = an_ag_market  -- * (owner.pct_ownership/100),
	an_timber_market = an_timber_market -- * (owner.pct_ownership/100),
	an_timber_use = an_timber_use -- * (owner.pct_ownership/100),
*/
	pct_ownership = owner.pct_ownership,
	apply_pct_exemptions = owner.apply_pct_exemptions,
	percent_type = isnull(owner.percent_type, '')
from
	owner
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	owner.prop_id = appr_notice_prop_list.prop_id
and	owner.owner_id = appr_notice_prop_list.owner_id
and	owner.sup_num = appr_notice_prop_list.sup_num
and	owner.owner_tax_yr = appr_notice_prop_list.sup_yr


-- apply the percentage of ownership to the previous year values
/*
update
	appr_notice_prop_list
set
	an_prev_assessed_val = an_prev_assessed_val -- * (owner.pct_ownership/100), 
	an_prev_market_val = an_prev_market_val -- * (owner.pct_ownership/100),
	an_prev_appraised_val = an_prev_appraised_val -- * (owner.pct_ownership/100),
	an_prev_imprv_hstd_val = an_prev_imprv_hstd_val -- * (owner.pct_ownership/100),
	an_prev_imprv_non_hstd_val = an_prev_imprv_non_hstd_val -- * (owner.pct_ownership/100),
	an_prev_land_hstd_val = an_prev_land_hstd_val -- * (owner.pct_ownership/100),
	an_prev_land_non_hstd_val = an_prev_land_non_hstd_val -- * (owner.pct_ownership/100),
	an_prev_ag_land_mkt_val = an_prev_ag_land_mkt_val -- * (owner.pct_ownership/100),
	an_prev_ag_land_use_val = an_prev_ag_land_use_val -- * (owner.pct_ownership/100),
	an_prev_ten_percent_cap = an_prev_ten_percent_cap -- * (owner.pct_ownership/100),
	an_prev_ag_market_val = an_prev_ag_market_val -- * (owner.pct_ownership/100),
	an_prev_timber_market_val = an_prev_timber_market_val -- * (owner.pct_ownership/100),
	an_prev_timber_use = an_prev_timber_use -- * (owner.pct_ownership/100)	
from
	property_val,
	prop_supp_assoc,
	owner
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	prop_supp_assoc.prop_id = appr_notice_prop_list.prop_id
and	prop_supp_assoc.owner_tax_yr = (appr_notice_prop_list.sup_yr-1)
and	prop_supp_assoc.prop_id = property_val.prop_id
and	prop_supp_assoc.sup_num = property_val.sup_num
and	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
and	prop_supp_assoc.prop_id = owner.prop_id
and	prop_supp_assoc.sup_num = owner.sup_num
and	prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
and	appr_notice_prop_list.owner_id = owner.owner_id
*/


-- store various codes and ids
update
	appr_notice_prop_list
set
	prop_type_cd = property.prop_type_cd,
	geo_id = property.geo_id,
	ref_id1 = property.ref_id1,
	ref_id2 = property.ref_id2,
	dba_name  = property.dba_name,
	last_appraiser_id = property_val.last_appraiser_id
from
	property,
	property_val
where
	appr_notice_prop_list.prop_id = property.prop_id
and	appr_notice_prop_list.prop_id = property_val.prop_id
and	appr_notice_prop_list.sup_num = property_val.sup_num
and	appr_notice_prop_list.notice_yr = property_val.prop_val_yr
and	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num



-- now that we've got prop_type_cd, store personal property or mineral values
update
	appr_notice_prop_list
set
	an_pers_prop_mineral_value = an_market_val,
	an_prev_pers_prop_mineral_value = an_prev_market_val
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.prop_type_cd in ('P', 'A', 'MN')



-- store the last appraiser name
update
	appr_notice_prop_list
set
	last_appraiser_nm = appraiser.appraiser_nm
from
	appraiser
where
	appraiser.appraiser_id = appr_notice_prop_list.last_appraiser_id



-- store the situs
update
	appr_notice_prop_list
set
	situs_display = replace(situs.situs_display, char(13) + char(10), ' ')
from
	situs
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.prop_id = situs.prop_id
and	situs.primary_situs = 'Y'



delete from
	appr_notice_prop_list 
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num 
and exists
(
	select
		* 
	from
		appr_notice_prop_list as temp_list
	where
		temp_list.notice_yr =  @input_notice_yr
	and	temp_list.notice_num <> @input_notice_num
	and	temp_list.prop_id = appr_notice_prop_list.prop_id
	and	temp_list.sup_num  = appr_notice_prop_list.sup_num
	and	temp_list.sup_yr  = appr_notice_prop_list.sup_yr
	and	temp_list.owner_id  = appr_notice_prop_list.owner_id
	and	temp_list.an_assessed_val = appr_notice_prop_list.an_assessed_val 
	and	isnull(appr_notice_prop_list.code_list, 'F') <> 'T'
)
and	isnull(appr_notice_prop_list.special_group_id, '') = ''



update
	appr_notice_prop_list
set
	agent_copy = 'T'
from
	agent_assoc
where
	appr_notice_prop_list.prop_id = agent_assoc.prop_id
and	appr_notice_prop_list.owner_id  = agent_assoc.owner_id
and	appr_notice_prop_list.sup_yr  = agent_assoc.owner_tax_yr
and	agent_assoc.ca_mailings = 'T'
and
(
	(
		agent_assoc.eff_dt is not null
	and	agent_assoc.exp_dt is not null
	and	agent_assoc.eff_dt <= GetDate()
	and	agent_assoc.exp_dt >= GetDate()
	)
or	(
		agent_assoc.eff_dt is not null
	and	agent_assoc.exp_dt is null
	and	agent_assoc.eff_dt <= GetDate()
	)
)


update
	appr_notice_prop_list
set
	notice_owner_id = owner_id
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num


insert into
	appr_notice_prop_list
(
	notice_yr,
	notice_num,  
	prop_id, 
	owner_id,    
	sup_num, 
	sup_yr, 
	notice_owner_id,
	notice_owner_name,
	all_real, 
	all_personal,
	all_mineral, 
	all_mobile, 
	all_auto, 
	all_shared,
	value_inc_19a, 
	value_decr_19a, 
	code_x19a,
	code_x19ac,
	rend_19a, 
	rend_19a_ar, 
	last_appr_yr_19i,
	last_owner_change_19i, 
	code_x19i,
	code_x19ic,
	code_fn ,
	value_new_prop_19a, 
	an_assessed_val,  
	an_market_val,    
	file_as_name,              
	pct_ownership, 
	apply_pct_exemptions,
	addr_line1,           
	addr_line2 ,          
	addr_line3 ,          
	addr_city,       
	addr_state ,           
	addr_zip,           
	addr_country ,
	addr_deliverable ,
	an_imprv_hstd_val ,
	an_land_hstd_val ,
	an_ag_land_mkt_val,
	an_ag_land_use_val ,
	an_imprv_non_hstd_val ,
	an_land_non_hstd_val ,
	an_ag_market,
	an_timber_market,
	an_appraised_val ,
	an_ten_percent_cap ,
	an_prev_imprv_hstd_val,
	an_prev_land_hstd_val,
	an_prev_ag_land_mkt_val ,
	an_prev_ag_land_use_val,
	an_prev_imprv_non_hstd_val ,
	an_prev_land_non_hstd_val ,
	an_prev_appraised_val,
	an_prev_assessed_val ,
	an_prev_market_val,
	an_prev_ten_percent_cap,
	an_timber_use,
	an_prev_ag_market_val,
	an_prev_timber_market_val,
	an_prev_timber_use,
	an_prev_yr ,
	prop_type_cd ,
	geo_id ,
	ref_id1,
	ref_id2,
	legal_desc,                                                  
	legal_desc_2,                                                
	legal_acreage ,   
	dba_name ,          
	situs_display,  
	last_appraiser_id,
	last_appraiser_nm  ,      
	agent_copy,
	an_5yr,
	an_5yr_assessed_val,
	an_5yr_assessed_val_pct_change,
	an_pers_prop_mineral_value,
	an_prev_pers_prop_mineral_value,
	percent_type,
	code_list,
	special_group_id
)
select distinct
	appr_notice_prop_list.notice_yr,
	appr_notice_prop_list.notice_num,  
	appr_notice_prop_list.prop_id, 
	agent_assoc.agent_id,    
	appr_notice_prop_list.sup_num, 
	appr_notice_prop_list.sup_yr, 
	appr_notice_prop_list.notice_owner_id,
	appr_notice_prop_list.notice_owner_name,
	appr_notice_prop_list.all_real, 
	appr_notice_prop_list.all_personal,
	appr_notice_prop_list.all_mineral, 
	appr_notice_prop_list.all_mobile, 
	appr_notice_prop_list.all_auto, 
	appr_notice_prop_list.all_shared,
	appr_notice_prop_list.value_inc_19a, 
	appr_notice_prop_list.value_decr_19a, 
	appr_notice_prop_list.code_x19a,
	appr_notice_prop_list.code_x19ac,
	appr_notice_prop_list.rend_19a, 
	appr_notice_prop_list.rend_19a_ar, 
	appr_notice_prop_list.last_appr_yr_19i,
	appr_notice_prop_list.last_owner_change_19i, 
	appr_notice_prop_list.code_x19i,
	appr_notice_prop_list.code_x19ic,
	appr_notice_prop_list.code_fn ,
	appr_notice_prop_list.value_new_prop_19a, 
	appr_notice_prop_list.an_assessed_val,  
	appr_notice_prop_list.an_market_val,    
	appr_notice_prop_list.file_as_name,              
	appr_notice_prop_list.pct_ownership, 
	appr_notice_prop_list.apply_pct_exemptions,
	appr_notice_prop_list.addr_line1,           
	appr_notice_prop_list.addr_line2 ,          
	appr_notice_prop_list.addr_line3 ,          
	appr_notice_prop_list.addr_city,          
	appr_notice_prop_list.addr_state ,           
	appr_notice_prop_list.addr_zip,           
	appr_notice_prop_list.addr_country ,
	appr_notice_prop_list.addr_deliverable ,
	appr_notice_prop_list.an_imprv_hstd_val ,
	appr_notice_prop_list.an_land_hstd_val ,
	appr_notice_prop_list.an_ag_land_mkt_val,
	appr_notice_prop_list.an_ag_land_use_val ,
	appr_notice_prop_list.an_imprv_non_hstd_val ,
	appr_notice_prop_list.an_land_non_hstd_val ,
	appr_notice_prop_list.an_ag_market,
	appr_notice_prop_list.an_timber_market,
	appr_notice_prop_list.an_appraised_val ,
	appr_notice_prop_list.an_ten_percent_cap ,
	appr_notice_prop_list.an_prev_imprv_hstd_val,
	appr_notice_prop_list.an_prev_land_hstd_val,
	appr_notice_prop_list.an_prev_ag_land_mkt_val ,
	appr_notice_prop_list.an_prev_ag_land_use_val,
	appr_notice_prop_list.an_prev_imprv_non_hstd_val ,
	appr_notice_prop_list.an_prev_land_non_hstd_val ,
	appr_notice_prop_list.an_prev_appraised_val,
	appr_notice_prop_list.an_prev_assessed_val ,
	appr_notice_prop_list.an_prev_market_val,
	appr_notice_prop_list.an_prev_ten_percent_cap,
	appr_notice_prop_list.an_timber_use,
	appr_notice_prop_list.an_prev_ag_market_val,
	appr_notice_prop_list.an_prev_timber_market_val,
	appr_notice_prop_list.an_prev_timber_use,
	appr_notice_prop_list.an_prev_yr ,
	appr_notice_prop_list.prop_type_cd ,
	appr_notice_prop_list.geo_id ,
	appr_notice_prop_list.ref_id1,
	appr_notice_prop_list.ref_id2,           
	appr_notice_prop_list.legal_desc,                                             
	appr_notice_prop_list.legal_desc_2,                                              
	appr_notice_prop_list.legal_acreage ,   
	appr_notice_prop_list.dba_name ,          
	appr_notice_prop_list.situs_display,  
	appr_notice_prop_list.last_appraiser_id,
	appr_notice_prop_list.last_appraiser_nm  ,      
	'F',
	appr_notice_prop_list.an_5yr,
	appr_notice_prop_list.an_5yr_assessed_val,
	appr_notice_prop_list.an_5yr_assessed_val_pct_change,
	appr_notice_prop_list.an_pers_prop_mineral_value,
	appr_notice_prop_list.an_prev_pers_prop_mineral_value,
	appr_notice_prop_list.percent_type,
	appr_notice_prop_list.code_list,
	appr_notice_prop_list.special_group_id
from
	appr_notice_prop_list,
	agent_assoc
where
	appr_notice_prop_list.prop_id = agent_assoc.prop_id
and	appr_notice_prop_list.owner_id  = agent_assoc.owner_id
and	appr_notice_prop_list.sup_yr  = agent_assoc.owner_tax_yr
and	appr_notice_prop_list.notice_yr  = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	agent_assoc.ca_mailings = 'T'
and
(
	(
		agent_assoc.eff_dt is not null
	and	agent_assoc.exp_dt is not null
	and	agent_assoc.eff_dt <= GetDate()
	and	agent_assoc.exp_dt >= GetDate()
	)
or	(
		agent_assoc.eff_dt is not null
	and	agent_assoc.exp_dt is null
	and	agent_assoc.eff_dt <= GetDate()
	)
)


update
	appr_notice_prop_list
set
	file_as_name =
		case
			when isnull(account.confidential_flag, '') in ('T', 'Y') then isnull(account.confidential_file_as_name, '')
			else isnull(account.file_as_name, '')
		end
from
	account
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.owner_id = account.acct_id


update
	appr_notice_prop_list
set
	geo_id = ' ' 
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	geo_id is null


update
	appr_notice_prop_list
set
	ref_id1 = ' '
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	ref_id1 is null


update
	appr_notice_prop_list
set
	ref_id2 = ' '
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	ref_id2 is null


update
	appr_notice_prop_list
set
	dba_name = ' ' 
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	dba_name is null


update
	appr_notice_prop_list
set
	an_assessed_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_assessed_val is null


update
	appr_notice_prop_list
set
	an_market_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_market_val is null


update
	appr_notice_prop_list
set
	an_imprv_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_imprv_hstd_val is null


update
	appr_notice_prop_list
set
	an_land_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_land_hstd_val is null


update
	appr_notice_prop_list
set
	an_ag_land_mkt_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_ag_land_mkt_val is null


update
	appr_notice_prop_list
set
	an_ag_land_use_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_ag_land_use_val is null


update
	appr_notice_prop_list
set
	an_imprv_non_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_imprv_non_hstd_val is null


update
	appr_notice_prop_list
set
	an_land_non_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_land_non_hstd_val is null


update
	appr_notice_prop_list
set
	an_appraised_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_appraised_val is null


update
	appr_notice_prop_list
set
	an_ag_market = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_ag_market is null


update
	appr_notice_prop_list
set
	an_timber_market = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_timber_market is null


update
	appr_notice_prop_list
set
	an_timber_use = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_timber_use is null


update
	appr_notice_prop_list
set
	an_ten_percent_cap = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_ten_percent_cap is null


update
	appr_notice_prop_list
set
	an_prev_imprv_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_imprv_hstd_val is null


update
	appr_notice_prop_list
set
	an_prev_land_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_land_hstd_val is null


update
	appr_notice_prop_list
set
	an_prev_ag_land_mkt_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_ag_land_mkt_val is null


update
	appr_notice_prop_list
set
	an_prev_ag_land_use_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_ag_land_use_val is null


update
	appr_notice_prop_list
set
	an_prev_imprv_non_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_imprv_non_hstd_val is null


update
	appr_notice_prop_list
set
	an_prev_land_non_hstd_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_land_non_hstd_val is null


update
	appr_notice_prop_list
set
	an_prev_ag_market_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_ag_market_val is null


update
	appr_notice_prop_list
set
	an_prev_timber_market_val = 0
where	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_timber_market_val is null


update
	appr_notice_prop_list
set
	an_prev_appraised_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_appraised_val is null


update
	appr_notice_prop_list
set
	an_prev_assessed_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_assessed_val is null


update
	appr_notice_prop_list
set
	an_prev_market_val = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_market_val is null


update
	appr_notice_prop_list
set
	an_prev_ten_percent_cap = 0
where	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_ten_percent_cap is null


update
	appr_notice_prop_list
set
	an_prev_timber_use = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_timber_use is null


update
	appr_notice_prop_list
set
	agent_copy = 'F'
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.agent_copy is null


update
	appr_notice_prop_list
set
	notice_owner_name =
		case
			when isnull(account.confidential_flag, '') in ('T', 'Y') then isnull(account.confidential_file_as_name, '')
			else isnull(account.file_as_name, '')
		end
from
	account
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.notice_owner_id = account.acct_id


update
	appr_notice_prop_list
set
	addr_line1 = address.addr_line1,
	addr_line2 = address.addr_line2,
	addr_line3 = address.addr_line3,
	addr_city = address.addr_city,
	addr_state = address.addr_state,
	addr_zip = address.addr_zip,
	addr_country = address.country_cd,
	addr_deliverable = isnull(address.ml_deliverable, 'Y'),
	zip  = address.zip,
	cass = address.cass,
	route = address.route,
	zip_4_2 = address.zip_4_2,
	is_international = address.is_international
from
	address
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.owner_id = address.acct_id
and	address.primary_addr = 'Y'


update
	appr_notice_prop_list
set
	an_pers_prop_mineral_value = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_pers_prop_mineral_value is null




update
	appr_notice_prop_list
set
	an_prev_pers_prop_mineral_value = 0
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.an_prev_pers_prop_mineral_value is null



/* since we have added shared property we must delete property types when they are set to exclude all */
if exists
(
	select
		* 
	from
		appr_notice_selection_criteria
	where
		notice_yr = @input_notice_yr
	and	notice_num = @input_notice_num
)
begin 

	select  
		@real_option = real_option,
		@personal_option = personal_option,
		@mineral_option = mineral_option,
		@mobile_option = mobile_option,
		@auto_option = auto_option,
		@shared_prop_option = shared_prop_option
	from
		appr_notice_selection_criteria
	where
		notice_yr = @input_notice_yr
	and	notice_num = @input_notice_num

	if (@personal_option = 'E')
	begin
		delete from
			appr_notice_prop_list
		where
			prop_type_cd = 'P'
		and	notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num
		and	not exists
		(
			select
				*
			from
				shared_prop sp
			where
				sp.pacs_prop_id = appr_notice_prop_list.prop_id
			and	sp.shared_year = appr_notice_prop_list.notice_yr
		)
	end

	if (@mineral_option = 'E')
	begin
		delete from
			appr_notice_prop_list
		where
			prop_type_cd = 'MN'
		and	notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num
		and	not exists
		(
			select
				*
			from
				shared_prop sp
			where
				sp.pacs_prop_id = appr_notice_prop_list.prop_id
			and	sp.shared_year = appr_notice_prop_list.notice_yr
		)
	end

	if (@real_option = 'E')
	begin
		delete from
			appr_notice_prop_list
		where
			prop_type_cd = 'R'
		and	notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num
		and	not exists
		(
			select
				*
			from
				shared_prop sp
			where
				sp.pacs_prop_id = appr_notice_prop_list.prop_id
			and	sp.shared_year  = appr_notice_prop_list.notice_yr
		)
	end

	if (@mobile_option = 'E')
	begin
		delete from
			appr_notice_prop_list
		where
			prop_type_cd = 'MH'
		and	notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num
		and	not exists
		(
			select
				*
			from
				shared_prop sp
			where
				sp.pacs_prop_id = appr_notice_prop_list.prop_id
			and	sp.shared_year = appr_notice_prop_list.notice_yr
		)
	end

	if (@auto_option = 'E')
	begin
		delete from
			appr_notice_prop_list
		where
			prop_type_cd = 'A'
		and	notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num
		and	not exists
		(
			select
				*
			from
				shared_prop sp
			where
				sp.pacs_prop_id = appr_notice_prop_list.prop_id
			and	sp.shared_year = appr_notice_prop_list.notice_yr
		)
	end

	if (@shared_prop_option = 'E')
	begin
		delete from
			appr_notice_prop_list 
		where
			notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num
		and	exists
		(
			select
				*
			from
				shared_prop sp
			where
				sp.pacs_prop_id = appr_notice_prop_list.prop_id
			and	sp.shared_year = appr_notice_prop_list.notice_yr
		)
	end

	
end


-- Since there were several cases where rows might've been deleted from appr_notice_prop_list,
-- we'll need to synchronize appr_notice_prop_list_group_code by deleteing orphaned rows
delete
	appr_notice_prop_list_group_code
from
	appr_notice_prop_list_group_code as anplgc with (nolock)
where
	anplgc.notice_yr = @input_notice_yr
and	anplgc.notice_num = @input_notice_num
and	not exists
(
	select
		*
	from
		appr_notice_prop_list as anpl with (nolock)
	where
		anpl.notice_yr = anplgc.notice_yr
	and	anpl.notice_num = anplgc.notice_num
	and	anpl.prop_id = anplgc.prop_id
)
			

insert into appr_notice_prop_list_exemption
(
	notice_num,
	notice_yr,
	prop_id,
	owner_id,
	sup_num,
	sup_yr,
	exmpt_type_cd
)
select
	@input_notice_num, 
	@input_notice_yr,
	appr_notice_prop_list.prop_id,
	appr_notice_prop_list.owner_id,
	appr_notice_prop_list.sup_num,
	appr_notice_prop_list.sup_yr,
	property_exemption.exmpt_type_cd	
from
	appr_notice_prop_list,
	property_exemption
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	appr_notice_prop_list.prop_id = property_exemption.prop_id
and   	appr_notice_prop_list.notice_owner_id = property_exemption.owner_id
and  	appr_notice_prop_list.sup_num = property_exemption.sup_num
and  	appr_notice_prop_list.sup_yr = property_exemption.owner_tax_yr
and	not exists
(
	select
		*
	from
		appr_notice_prop_list_exemption
	where
		appr_notice_prop_list_exemption.notice_yr = @input_notice_yr
	and	appr_notice_prop_list_exemption.notice_num = @input_notice_num
	and	appr_notice_prop_list_exemption.prop_id = appr_notice_prop_list.prop_id
	and   	appr_notice_prop_list_exemption.owner_id = appr_notice_prop_list.notice_owner_id
	and	appr_notice_prop_list_exemption.sup_num = appr_notice_prop_list.sup_num
	and	appr_notice_prop_list_exemption.sup_yr = appr_notice_prop_list.sup_yr
	and	appr_notice_prop_list_exemption.exmpt_type_cd = property_exemption.exmpt_type_cd
)

/* set system address */
update
	appr_notice_prop_list
set
	sys_addr_line1 = system_address.addr_line1,
	sys_addr_line2 = system_address.addr_line2,
	sys_addr_line3 = system_address.addr_line3,
	sys_addr_city = system_address.city,
	sys_addr_state = system_address.state,
	sys_addr_zip = system_address.zip,
	sys_phone_num = system_address.phone_num,
	sys_fax_num = system_address.fax_num,
	sys_chief_appraiser = system_address.chief_appraiser
from
	system_address
where
	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num
and	system_address.system_type = 'A'


/* build list of exemptions */

declare @prop_id	int
declare @owner_id	int
declare @exmpt_type_cd  varchar(5)
declare @prev_prop_id	int
declare @prev_owner_id	int
declare @str_exemption  varchar(100)

set @prev_prop_id  = 0
set @prev_owner_id = 0


update
	appr_notice_prop_list
set
	exemption = NULL 
where
	notice_yr = @input_notice_yr
and	notice_num = @input_notice_num


declare property_exemption_cursor scroll cursor
for
select distinct
	prop_id,
	owner_id,
	exmpt_type_cd
from
	appr_notice_prop_list_exemption
where
	notice_yr = @input_notice_yr
and	notice_num = @input_notice_num
order by
	prop_id,
	owner_id,
	exmpt_type_cd


open property_exemption_cursor
fetch next from property_exemption_cursor
into
	@prop_id,
	@owner_id,
	@exmpt_type_cd

while (@@fetch_status = 0)
begin
	if ((@prop_id <> @prev_prop_id) or (@owner_id <> @prev_owner_id))
	begin
		update
			appr_notice_prop_list 
		set
			exemption = @str_exemption
		where
			prop_id = @prev_prop_id
		and	owner_id = @prev_owner_id
		and	notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num 
	
		set @prev_prop_id = @prop_id
		set @prev_owner_id = @owner_id
		set @str_exemption = NULL
	end

	if (@str_exemption is null)
	begin
		set @str_exemption = rtrim(@exmpt_type_cd)
	end
	else
	begin
		set @str_exemption = @str_exemption + ', ' + rtrim(@exmpt_type_cd)
	end

	fetch next from property_exemption_cursor
	into
		@prop_id,
		@owner_id,
		@exmpt_type_cd
end


update
	appr_notice_prop_list 
set
	exemption = @str_exemption
where
	prop_id = @prev_prop_id
and	owner_id = @prev_owner_id
and	notice_yr = @input_notice_yr
and	notice_num = @input_notice_num 


close property_exemption_cursor
deallocate property_exemption_cursor




/* build list of previous year exemptions */

select @prev_prop_id  = 0


update
	appr_notice_prop_list
set
	prev_exemption = NULL 
where
	notice_yr = @input_notice_yr
and	notice_num = @input_notice_num


declare prev_property_exemption_cursor scroll cursor
for
select distinct
	pe.prop_id,
	pe.exmpt_type_cd
from
	appr_notice_prop_list as anpl with (nolock)
join
	property_exemption as pe with (nolock)
on
	anpl.prop_id = pe.prop_id
and	(anpl.sup_yr - 1) = pe.exmpt_tax_yr
and	(anpl.sup_yr - 1) = pe.owner_tax_yr
join
	prop_supp_assoc as psa with (nolock)
on
	pe.prop_id = psa.prop_id
and	pe.owner_tax_yr = psa.owner_tax_yr
and	pe.exmpt_tax_yr = psa.owner_tax_yr
and	pe.sup_num = psa.sup_num
where
	anpl.notice_yr = @input_notice_yr
and	anpl.notice_num = @input_notice_num
order by
	pe.prop_id,
	pe.exmpt_type_cd


open prev_property_exemption_cursor
fetch next from prev_property_exemption_cursor
into
	@prop_id,
	@exmpt_type_cd

while (@@fetch_status = 0)
begin
	if (@prop_id <> @prev_prop_id)
	begin
		update
			appr_notice_prop_list 
		set
			prev_exemption = @str_exemption
		where
			prop_id = @prev_prop_id
		and	notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num 
	
		set @prev_prop_id = @prop_id
		set @str_exemption = NULL
	end

	if (@str_exemption is null)
	begin
		set @str_exemption = rtrim(@exmpt_type_cd)
	end
	else
	begin
		set @str_exemption = @str_exemption + ', ' + rtrim(@exmpt_type_cd)
	end


	fetch next from prev_property_exemption_cursor
	into
		@prop_id,
		@exmpt_type_cd
end


update
	appr_notice_prop_list 
set
	prev_exemption = @str_exemption
where
	prop_id = @prev_prop_id
and	notice_yr = @input_notice_yr
and	notice_num = @input_notice_num 


close prev_property_exemption_cursor
deallocate prev_property_exemption_cursor

/*******************************************************************************************/
/******************************* Build Shared CAD Code entries *****************************/
/*******************************************************************************************/
insert into
	appr_notice_prop_list_shared_cad
(
	notice_yr, 
	notice_num,  
	prop_id, 
	owner_id,    
	sup_num, 
	sup_yr, 
	CAD_code, 
	CAD_desc,           
	CAD_addr_line1,         
	CAD_addr_line2,         
	CAD_addr_line3,         
	CAD_addr_city,          
	CAD_addr_state, 
	CAD_addr_zip,           
	CAD_phone_num          
)
select distinct
	notice_yr, 
	notice_num,  
	prop_id, 
	owner_id,    
	shared_prop.sup_num, 
	sup_yr, 
	CAD_code, 
	isnull(CAD_desc, ''),           
	isnull(CAD_addr_line1, ''),         
	isnull(CAD_addr_line2, ''),         
	isnull(CAD_addr_line3, ''),         
	isnull(CAD_addr_city, ''),          
	isnull(CAD_addr_state, ''), 
	isnull(CAD_addr_zip, ''),           
	isnull(CAD_phone_num, '')   
from
	appr_notice_prop_list,
	shared_prop, cad
where
	appr_notice_prop_list.prop_id = shared_prop.pacs_prop_id   
and     appr_notice_prop_list.notice_yr = shared_prop.shared_year
and	shared_prop.shared_cad_code = cad.CAD_code
and	appr_notice_prop_list.notice_yr = @input_notice_yr
and	appr_notice_prop_list.notice_num = @input_notice_num

GO

