



CREATE  view gis_property_profile_vw
as
select  property_profile.*
from property_profile, pacs_system
where prop_val_yr = appr_yr
--and prop_id = -1

GO

