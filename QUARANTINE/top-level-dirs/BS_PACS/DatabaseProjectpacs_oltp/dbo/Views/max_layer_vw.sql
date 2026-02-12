

create view max_layer_vw
as

select mpyw.prop_id, mpyw.max_prop_val_yr, max_sup_num = max(psa.sup_num)
from prop_supp_assoc as psa
join max_prop_year_vw as mpyw on
	psa.prop_id = mpyw.prop_id and
	psa.owner_tax_yr = mpyw.max_prop_val_yr
group by mpyw.prop_id, mpyw.max_prop_val_yr

GO

