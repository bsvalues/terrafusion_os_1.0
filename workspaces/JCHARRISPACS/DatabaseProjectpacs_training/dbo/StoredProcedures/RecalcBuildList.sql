


CREATE PROCEDURE RecalcBuildList
@input_yr		numeric(4,0),
@input_sup_num		int

AS

delete from recalc_supp_assoc

insert into recalc_supp_assoc
(prop_id, sup_num, owner_tax_yr)
select distinct prop_id,  max(sup_num), prop_val_yr
from property_val
where sup_num <= @input_sup_num
and   prop_val_yr = @input_yr
group by prop_id, prop_val_yr
order by prop_id

GO

