create view econ_unit as 

select distinct p.prop_id,ref_id2
from imprv_detail id
inner join imprv i on   i.prop_val_yr = id.prop_val_yr   AND i.sup_num = id.sup_num     AND id.sale_id = 0     AND i.imprv_id = id.imprv_id 	  
left join property_val pv 	  on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num	  

INNER JOIN prop_supp_assoc as psa with (nolock)
ON    pv.prop_id = psa.prop_id
AND   pv.prop_val_yr = psa.owner_tax_yr
AND   pv.sup_num = psa.sup_num

INNER JOIN property as p with (nolock)
ON    pv.prop_id = p.prop_id

where pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)	  and id.sale_id=0	  and pv.hood_cd like '6%'
and i.imprv_type_cd = 'C' and id.prop_val_yr=2019
and p.ref_id2 like 'E%'

GO

