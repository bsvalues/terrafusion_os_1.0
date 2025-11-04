

create view max_prop_year_vw
as

select psa.prop_id, max_prop_val_yr = max(psa.owner_tax_yr)
from prop_supp_assoc as psa
group by psa.prop_id

GO

