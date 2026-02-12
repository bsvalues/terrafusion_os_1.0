


create view income_num_units_vw

as

select ipa.income_id, ipa.sup_num, ipa.prop_val_yr, sum(num_imprv) as num_units
from income_prop_assoc ipa,
     imprv i
where ipa.prop_id = i.prop_id
and   ipa.sup_num = i.sup_num
and   ipa.prop_val_yr = i.prop_val_yr
and   i.sale_id = 0
	
group by ipa.income_id, ipa.sup_num, ipa.prop_val_yr

GO

