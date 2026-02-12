
create view current_year_property_type_ioll_vw

as

select pv.prop_id, 
			case when p.prop_type_cd = 'R' and isnull(pst.imp_leased_land,0) = 1 then 'IOLL'
					else p.prop_type_cd end as property_type,
			case when p.prop_type_cd = 'R' and isnull(pst.imp_leased_land,0) = 1 then 'Imp on Leased Land'
					else pt.prop_type_desc end as property_type_desc
from property as p
with (nolock)
join property_val as pv
with (nolock)
on p.prop_id = pv.prop_id
join (select distinct prop_id, MAX(prop_val_yr) as prop_val_yr from property_val group by prop_id) as pvy
on pv.prop_val_yr = pvy.prop_val_yr
and pv.prop_id = pvy.prop_id
join prop_supp_assoc as psa
with (nolock)
on pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num
and pv.prop_id = psa.prop_id
join property_type as pt
with (nolock)
on p.prop_type_cd = pt.prop_type_cd
left outer join property_sub_type as pst
with (nolock)
on pv.sub_type = pst.property_sub_cd

GO

