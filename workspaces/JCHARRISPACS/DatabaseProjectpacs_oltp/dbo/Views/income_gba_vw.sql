


CREATE  view income_gba_vw

as

select ipa.income_id, ipa.sup_num, ipa.prop_val_yr, sum(imprv_det_area) as gba
from income_prop_assoc ipa,
     imprv_detail idd,
     imprv_det_type idt
where ipa.prop_id = idd.prop_id
and   ipa.sup_num = idd.sup_num
and   ipa.prop_val_yr = idd.prop_val_yr
and   idd.sale_id = 0
and   idd.imprv_det_type_cd = idt.imprv_det_type_cd 
and   idt.main_area = 'T'
	
group by ipa.income_id, ipa.sup_num, ipa.prop_val_yr

GO

