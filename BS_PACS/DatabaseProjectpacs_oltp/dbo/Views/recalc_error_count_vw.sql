
CREATE view recalc_error_count_vw as
select pacs_year.tax_yr as sup_yr, isnull(errors.error_ct, 0) as error_ct
from pacs_year
left join 
(
 SELECT prop_recalc_errors.sup_yr, COUNT(*) AS error_ct
 FROM prop_recalc_errors 
 JOIN property_val ON 
   property_val.prop_id = prop_recalc_errors.prop_id 
  AND property_val.prop_val_yr = prop_recalc_errors.sup_yr 
  AND property_val.sup_num = prop_recalc_errors.sup_num
 WHERE property_val.prop_inactive_dt IS NULL
 GROUP BY prop_recalc_errors.sup_yr
) AS errors
on pacs_year.tax_yr = errors.sup_yr

GO

