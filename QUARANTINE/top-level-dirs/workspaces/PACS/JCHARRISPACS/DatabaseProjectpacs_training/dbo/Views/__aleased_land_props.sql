create view __aleased_land_props as
SELECT *

from current_leased_land_prop
	where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)  and  is_leased_land_property=1

GO

