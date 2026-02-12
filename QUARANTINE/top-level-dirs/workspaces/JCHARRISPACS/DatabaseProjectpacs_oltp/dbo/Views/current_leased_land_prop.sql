create view  current_leased_land_prop as
SELECT
	pv.prop_id,
	pv.prop_val_yr,
	is_leased_land_property =
		convert(bit, case when isnull(pst.imp_leased_land, 0) = 1 and p.prop_type_cd = 'R'
				then 1 else 0 end)
from property as p with (nolock)
join prop_supp_assoc as psa with(nolock) on
	psa.prop_id = p.prop_id
join property_val as pv with(nolock) on
	pv.prop_id = p.prop_id and 
	pv.prop_val_yr = psa.owner_tax_yr and 
	pv.sup_num = psa.sup_num
left outer join property_sub_type as pst with(nolock) on
	pst.property_sub_cd = pv.sub_type
	where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)  --and  is_leased_land_property=1

GO

