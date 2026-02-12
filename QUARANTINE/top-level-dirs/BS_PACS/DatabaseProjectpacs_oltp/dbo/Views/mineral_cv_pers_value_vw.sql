




create view mineral_cv_pers_value_vw
as
select sum(value) as value, prop_id, prop_val_yr
from mineral_property_cv
group by prop_id, prop_val_yr

GO

