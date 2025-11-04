














/****** Object:  View dbo.PROP_CURR_YR_VW    Script Date: 1/3/99 9:45:17 PM ******/

/****** Object:  View dbo.PROP_CURR_YR_VW    Script Date: 1/3/99 11:57:06 AM ******/
/****** Object:  View dbo.PROP_CURR_YR_VW    Script Date: 12/21/98 5:34:12 PM ******/
create view PROP_CURR_YR_VW 
as
select distinct prop_id, max(owner_tax_yr) as tax_year 
from prop_supp_assoc
group by prop_id

GO

