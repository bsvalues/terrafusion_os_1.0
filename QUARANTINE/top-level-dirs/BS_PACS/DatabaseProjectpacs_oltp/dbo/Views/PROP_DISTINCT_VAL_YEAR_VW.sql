
CREATE VIEW dbo.PROP_DISTINCT_VAL_YEAR_VW
AS
select pacs_system.appr_yr as prop_val_yr
from pacs_system 
union 
select pacs_year.tax_yr as prop_val_yr
from pacs_year

GO

