














/****** Object:  View dbo.PROP_GROUP_ASSOC_VW    Script Date: 1/3/99 9:45:18 PM ******/

/****** Object:  View dbo.PROP_GROUP_ASSOC_VW    Script Date: 1/3/99 11:57:07 AM ******/
/****** Object:  View dbo.PROP_GROUP_ASSOC_VW    Script Date: 12/21/98 5:34:04 PM ******/
create view PROP_GROUP_ASSOC_VW
as
select prop_group_assoc.prop_id, prop_group_assoc.prop_group_cd, prop_group_code.group_desc
from prop_group_assoc, prop_group_code
where prop_group_assoc.prop_group_cd = prop_group_code.group_cd

GO

