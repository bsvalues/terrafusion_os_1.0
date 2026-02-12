
create view VerifyExpPersonalPropertyVal_vw
as
select 
	pv.prop_id  ,
	pv.prop_val_yr as year,
	convert(numeric(14,0), pv.land_hstd_val) as land_hstd_val,
	convert(numeric(14,0), pv.land_non_hstd_val) as  land_non_hstd_val,
	convert(numeric(14,0), pv.imprv_hstd_val) as  imprv_hstd_val,
	convert(numeric(14,0), pv.imprv_non_hstd_val) as imprv_non_hstd_val ,
	convert(numeric(14,0), pv.appraised_val) as  appraised_val,
	convert(numeric(14,0), pv.assessed_val) as  assessed_val,
	convert(numeric(14,0), pv.market_value) as  market_value,
	convert(numeric(14,0), pv.ag_use_val) as  ag_use_val,
	convert(numeric(14,0), pv.ag_market) as  ag_market,
	convert(numeric(14,0), pv.timber_use) as  timber_use,
	convert(numeric(14,0), pv.ten_percent_cap) as  ten_percent_cap,
	pv.sup_num  ,
	0 as owner_id,
	0 as entity_id,
	'EXPP_AV_MV' as check_cd,
	0 as ic_ref_id
from export_appraisal_info as pv with(nolock)

inner join property as p with(nolock) on
p.prop_id=pv.prop_id

where isnull(pv.prop_type_cd,'') IN ('P', 'MN') 
and convert(numeric(14,0), assessed_val) <> convert(numeric(14,0), market_value)

GO

