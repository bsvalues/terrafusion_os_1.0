
create view [dbo].[__current_active_parcels] as 
select pv.prop_id,pv.prop_val_yr,p.alt_dba_name,p.geo_id,p.prop_type_cd,p.state_cd,p.remarks, pv.hood_cd,pv.tract_or_lot,pv.eff_size_acres,pv.sub_type,pv.orig_appraised_val,
			case when p.prop_type_cd = 'R' and isnull(pst.imp_leased_land,0) = 1 then 'IOLL'
					else p.prop_type_cd end as property_type,
			case when p.prop_type_cd = 'R' and isnull(pst.imp_leased_land,0) = 1 then 'Imp on Leased Land'
					else pt.prop_type_desc end as property_type_desc,
					 pv.appraised_val,pv.market,pv.cycle,pv.property_use_cd,
					 pv.land_hstd_val+pv.land_non_hstd_val as LandVal,pv.imprv_hstd_val+pv.imprv_non_hstd_val as ImprvVal,pv.ag_market,pv.ag_use_val, pv.prop_inactive_dt,p.mass_created_from,pv.map_id, pv.mapsco,pv.value_appraiser_id
					,psa.sup_num,pst.commercial, pst.boat,pst.prop_type,pst.farm,pst.industrial,pst.property_sub_cd,pst.property_sub_desc,pst.local_assessed_utility
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

where pv.prop_inactive_dt is null
--and p.prop_type_cd='r'
and pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

