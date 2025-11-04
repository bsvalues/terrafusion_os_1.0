













/****** Object:  View dbo.PROCESSED_LEVY_ROLL_VW    Script Date: 1/3/99 9:45:17 PM ******/

/****** Object:  View dbo.PROCESSED_LEVY_ROLL_VW    Script Date: 1/3/99 11:57:06 AM ******/
/****** Object:  View dbo.PROCESSED_LEVY_ROLL_VW    Script Date: 12/21/98 5:34:11 PM ******/
create view PROCESSED_LEVY_ROLL_VW
as
select entity_id, levy_roll_log.tax_yr 
from   pacs_system, levy_roll_log
where  pacs_system.tax_yr = levy_roll_log.tax_yr

GO

