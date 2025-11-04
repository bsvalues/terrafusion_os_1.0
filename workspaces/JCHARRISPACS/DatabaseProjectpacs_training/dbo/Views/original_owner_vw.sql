

create view original_owner_vw
as
select 
	[owner_id]  ,
	o.[owner_tax_yr]  ,
	o.[prop_id]  ,
	[updt_dt]  ,
	[pct_ownership]  ,
	[owner_cmnt]  ,
	[over_65_defer]  ,
	[over_65_date]  ,
	[ag_app_filed]  ,
	[apply_pct_exemptions]  ,
	[sup_num]  ,
	[type_of_int]  ,
	[hs_prop]  ,
	[birth_dt]  ,
	[roll_exemption]  ,
	[roll_state_code]  ,
	[roll_entity]  ,
	[pct_imprv_hs]  ,
	[pct_imprv_nhs]  ,
	[pct_land_hs]  ,
	[pct_land_nhs]  ,
	[pct_ag_use]  ,
	[pct_ag_mkt]  ,
	[pct_tim_use]  ,
	[pct_tim_mkt]  ,
	[pct_pers_prop]  ,
	[udi_child_prop_id]  ,
	[percent_type]
from owner as o with(nolock)
inner join
(
	select prop_id,max(owner_tax_yr) as owner_tax_yr
	from prop_supp_assoc as psa with(nolock)
	inner join pacs_system as ps with(nolock) on
	1=1
	where owner_tax_yr<=ps.tax_yr
	group by prop_id
) as maxyr on
		o.prop_id=maxyr.prop_id
and o.owner_tax_yr=maxyr.owner_tax_yr

GO

