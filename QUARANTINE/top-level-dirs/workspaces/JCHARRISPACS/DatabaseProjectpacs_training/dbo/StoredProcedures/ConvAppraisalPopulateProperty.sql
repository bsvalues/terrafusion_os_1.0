

CREATE PROCEDURE ConvAppraisalPopulateProperty
@input_appr_company	int,
@input_yr		numeric(4)

as

--Update property information
update property set geo_id        	= collections_property_cv.geo_id,
   	            prop_create_dt 	= collections_property_cv.prop_create_dt,
		    prop_type_cd   	= collections_property_cv.prop_type_cd,
		    state_cd		= collections_property_cv.state_cd,
		    prop_sic_cd		= collections_property_cv.prop_sic_cd,
		    ref_id1		= collections_property_cv.ref_id1,
		    ref_id2		= collections_property_cv.ref_id2
from 	collections_property_cv
where 	property.prop_id = collections_property_cv.prop_id

--Update property_val information
update property_val set abs_subdv_cd	= collections_property_cv.abs_subdv_cd,
		    block		= collections_property_cv.block,
		    tract_or_lot	= collections_property_cv.tract_or_lot
from 	collections_property_cv
where   property_val.prop_id 		= collections_property_cv.prop_id
and     property_val.prop_val_yr 	= @input_yr
	
--Create new property
insert into property
(
prop_id,
geo_id,
prop_type_cd,
state_cd,
prop_sic_cd,
ref_id1,
ref_id2	
)
select prop_id,
	geo_id,
	prop_type_cd,
	state_cd,
	prop_sic_cd,
	ref_id1,
	ref_id2
from collections_property_cv
where not exists (select * from property as p1 where p1.prop_id = collections_property_cv.prop_id)

/* Update mineral accounts */
update mineral_acct set field_cd     = collections_property_cv.field_cd,
			mineral_zone = collections_property_cv.mineral_zone,
			rr_comm_num  = collections_property_cv.rr_comm_num,
			lease_id     = collections_property_cv.lease_id,
			lease_nm     = collections_property_cv.lease_nm,
			opr	     = collections_property_cv.opr,
			type_of_int  = collections_property_cv.type_of_int,
			well_type    = collections_property_cv.well_type,
			geo_info     = collections_property_cv.geo_info,
			barrels_per_day = collections_property_cv.barrels_per_day
	from  collections_property_cv
	where mineral_acct.prop_id = collections_property_cv.prop_id
	and   collections_property_cv.prop_type_cd = 'MN'

/* Insert new mineral accounts */
insert into mineral_acct
(
mineral_acct_id,
prop_id,
field_cd,
mineral_zone,
rr_comm_num,
lease_id,
lease_nm,
opr,
type_of_int,
well_type,
geo_info,
barrels_per_day
)
select distinct
prop_id,
prop_id,
field_cd,
mineral_zone,
rr_comm_num,
lease_id,
lease_nm,
opr,
type_of_int,
well_type,
geo_info,
barrels_per_day
from collections_property_cv
where not exists (select * from mineral_acct as ma1 where ma1.prop_id = collections_property_cv.prop_id)
and collections_property_cv.prop_type_cd = 'MN'
		

/* Update Property Val information */
update property_val set legal_desc    		= collections_property_cv.legal_desc,
  	                recalc_flag  		= 'C',
			assessed_val  		= collections_property_cv.assessed_val,
			appraised_val 		= collections_property_cv.appraised_val,
			imprv_hstd_val		= collections_property_cv.imprv_hstd_val,
			imprv_non_hstd_val	= collections_property_cv.imprv_non_hstd_val,
			land_hstd_val		= collections_property_cv.land_hstd_val,
			land_non_hstd_val	= collections_property_cv.land_non_hstd_val,
			ag_use_val		= collections_property_cv.ag_use_val,
			ag_market		= collections_property_cv.ag_market,
			ag_loss			= collections_property_cv.ag_loss,
			market			= collections_property_cv.market,
			ten_percent_cap		= collections_property_cv.hs_cap_loss,
			legal_acreage		= collections_property_cv.legal_acreage,
			freeze_ceiling		= collections_property_cv.freeze_ceiling,
			freeze_yr		= collections_property_cv.freeze_yr,
			mineral_int_pct		= collections_property_cv.mineral_int_pct,
			new_val			= collections_property_cv.new_val,
			last_appraisal_yr	= collections_property_cv.last_appraisal_yr,
			appr_company_id		= @input_appr_company,
			abs_subdv_cd		= collections_property_cv.abs_subdv_cd,
		    	block			= collections_property_cv.block,
		    	tract_or_lot		= collections_property_cv.tract_or_lot
from collections_property_cv
where property_val.prop_id     = collections_property_cv.prop_id
and   property_val.prop_val_yr = collections_property_cv.prop_val_yr

	
/* Populate Property Val information */
insert into property_val
(
prop_id,
sup_num,
prop_val_yr,
legal_desc,
assessed_val,
appraised_val,
appr_company_id,
recalc_flag, 
prev_sup_num,
imprv_hstd_val,
imprv_non_hstd_val,
land_hstd_val,
land_non_hstd_val,
ag_use_val,
ag_market,
ag_loss,
market,
ten_percent_cap,
legal_acreage,
freeze_ceiling,
freeze_yr,
mineral_int_pct,
new_val,
last_appraisal_yr,
abs_subdv_cd,
block,
tract_or_lot
)
select distinct
prop_id,
0,
prop_val_yr,
legal_desc,
assessed_val,
appraised_val,
@input_appr_company,
'C',
0,
imprv_hstd_val,
imprv_non_hstd_val,
land_hstd_val,
land_non_hstd_val,
ag_use_val,
ag_market,
ag_loss,
market,
hs_cap_loss,
legal_acreage,
freeze_ceiling,
freeze_yr,
mineral_int_pct,
new_val,
last_appraisal_yr,
abs_subdv_cd,
block,
tract_or_lot
from collections_property_cv
where not exists (select * from property_val as pv1 
		  where pv1.prop_id 	= collections_property_cv.prop_id 
		  and   pv1.prop_val_yr = collections_property_cv.prop_val_yr)


insert into mortgage_assoc
(
prop_id,
mortgage_co_id,
mortgage_acct_id
)
select
prop_id,
mortgage_co_id,
null
from collections_property_cv, mortgage_co
where not exists (select * from mortgage_assoc as ma
		  where ma.prop_id = collections_property_cv.prop_id)
and collections_property_cv.mortgage_acct_id > '00000'
and collections_property_cv.mortgage_acct_id = mortgage_co.mortgage_cd
		

insert into prop_supp_assoc
(
prop_id,
owner_tax_yr,
sup_num
)
select distinct
prop_id,
prop_val_yr,
0
from collections_property_cv
where not exists (select * from prop_supp_assoc as psa1 
		  where psa1.prop_id 	  = collections_property_cv.prop_id 
		  and   psa1.owner_tax_yr = collections_property_cv.prop_val_yr)
	
	
update situs set situs_street = collections_property_cv.situs_street
from collections_property_cv
where collections_property_cv.prop_id = situs.prop_id
and not exists (select * from situs where situs.prop_id = collections_property_cv.prop_id)


update owner set type_of_int = collections_property_cv.type_of_int, pct_ownership = 100
from collections_property_cv
where owner.prop_id      = collections_property_cv.prop_id
and   owner.owner_id     = collections_property_cv.owner_id
and   owner.sup_num      = 0
and   owner.owner_tax_yr = collections_property_cv.prop_val_yr
	
insert into owner
(
prop_id,
owner_id,
sup_num,
owner_tax_yr,
type_of_int,
pct_ownership,
updt_dt
)
select distinct
prop_id,
owner_id,
0,
prop_val_yr,
type_of_int,
100,
GetDate()
from collections_property_cv
where not exists (select * from owner as o1 
		  where o1.prop_id 	= collections_property_cv.prop_id 
		  and   o1.owner_tax_yr = collections_property_cv.prop_val_yr
		  and   o1.owner_id     = collections_property_cv.owner_id)


delete from entity_prop_assoc
from 	collections_property_cv
where 	entity_prop_assoc.prop_id = collections_property_cv.prop_id
and 	entity_prop_assoc.tax_yr  = collections_property_cv.prop_val_yr

	
delete from property_exemption 
from 	collections_property_cv
where 	property_exemption.prop_id      = collections_property_cv.prop_id
and 	property_exemption.owner_tax_yr = collections_property_cv.prop_val_yr

	
delete from property_entity_exemption 
from 	collections_property_cv
where 	property_entity_exemption.prop_id 	= collections_property_cv.prop_id
and 	property_entity_exemption.owner_tax_yr  = collections_property_cv.prop_val_yr


delete from property_special_entity_exemption 
from 	collections_property_cv
where 	property_special_entity_exemption.prop_id 	= collections_property_cv.prop_id
and 	property_special_entity_exemption.owner_tax_yr  = collections_property_cv.prop_val_yr


insert into entity_prop_assoc
(
entity_id,
prop_id,
sup_num,
tax_yr,
entity_prop_pct
)
select distinct  
entity_id, 
prop_id,
0,
tax_yr,
entity_prop_pct
from collections_entity_cv
where  not exists (select * from entity_prop_assoc
		where entity_prop_assoc.prop_id   = collections_entity_cv.prop_id
		and   entity_prop_assoc.tax_yr 	  = collections_entity_cv.tax_yr
		and   entity_prop_assoc.entity_id = collections_entity_cv.entity_id)

GO

