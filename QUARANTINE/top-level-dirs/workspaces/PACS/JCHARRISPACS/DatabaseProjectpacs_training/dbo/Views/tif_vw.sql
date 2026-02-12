

--HS 17834 _ after discussing Eric , rewrote the following view
/****** Object:  View dbo.tif_vw    Script Date: 5/16/00 4:07:49 PM ******/
CREATE VIEW dbo.tif_vw
AS

select 	psa.owner_tax_yr, 
        entity.entity_id, entity.entity_cd,
	SUM(ISNULL(poev.taxable_val,0)) as taxable_val,
	SUM(ISNULL(poev.tax_increment_imprv_val ,0)+ ISNULL(poev.tax_increment_land_val,0 ))as tif_val
from 	prop_supp_assoc psa 
inner join prop_owner_entity_val poev on
	psa.prop_id = poev.prop_id and 
	psa.owner_tax_yr = poev.sup_yr and 
	psa.sup_num = poev.sup_num
inner join entity on
	entity.entity_id = poev.entity_id
inner join property_val pv on
	poev.prop_id  = pv.prop_id and 
	poev.sup_yr = pv.prop_val_yr and
	poev.sup_num = pv.sup_num	
where (ISNULL(poev.tax_increment_imprv_val, 0) 
    + ISNULL(poev.tax_increment_land_val, 0) > 0) and 
	pv.prop_inactive_dt is null and 
	poev.tax_increment_flag = 'T'
	
GROUP BY entity.entity_id, entity.entity_cd,
    	 psa.owner_tax_yr

GO

