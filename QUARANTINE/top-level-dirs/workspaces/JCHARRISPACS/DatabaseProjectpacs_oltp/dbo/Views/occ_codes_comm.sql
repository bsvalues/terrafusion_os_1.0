create view occ_codes_comm as

select distinct pv.prop_id,id.imprv_det_type_cd, id.imprv_det_desc, occupancy_pct
,occupancy_code, occupancy_description, occupancy_name,pv.cycle

--COUNT(occupancy_code) as count
from imprv_detail id
inner join imprv i on   i.prop_val_yr = id.prop_val_yr   AND i.sup_num = id.sup_num     AND id.sale_id = 0     AND i.imprv_id = id.imprv_id 	  
left join property_val pv 	  on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num	  

INNER JOIN prop_supp_assoc as psa with (nolock)
ON    pv.prop_id = psa.prop_id
AND   pv.prop_val_yr = psa.owner_tax_yr
AND   pv.sup_num = psa.sup_num

INNER JOIN property as p with (nolock)
ON    pv.prop_id = p.prop_id
inner join 
imprv_detail_cms_occupancy as occ on occ.prop_id=pv.prop_id --and  occ.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)
where pv.prop_val_yr=2019	  and id.sale_id=0	  and pv.hood_cd like '6%' and occ.sale_id=0 and i.sale_id=0 and pv.sup_num=0 
and i.prop_val_yr=2019
and i.imprv_type_cd = 'C'-- and id.prop_val_yr=2019 --and imprv_det_type_cd='APARTRES ' and occupancy_description='Multiple Res (Low Rise)'
--and pv.cycle=4
group by occupancy_code, id.imprv_det_type_cd, id.imprv_det_desc, occupancy_description, occupancy_name, pv.prop_id,occupancy_pct,pv.cycle
--order by occupancy_code

GO

