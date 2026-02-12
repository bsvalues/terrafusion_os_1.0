













/****** Object:  View dbo.PACS_USER_RIGHTS_VW    Script Date: 1/3/99 9:45:17 PM ******/

/****** Object:  View dbo.PACS_USER_RIGHTS_VW    Script Date: 1/3/99 11:57:06 AM ******/
/****** Object:  View dbo.PACS_USER_RIGHTS_VW    Script Date: 12/21/98 5:34:11 PM ******/
create view PACS_USER_RIGHTS_VW
as
select pacs_user_rights.pacs_user_id, 
       pacs_user_rights.pacs_user_right_id,
       pacs_user_rights.pacs_user_right_type, 
       user_rights.user_right_desc 
from pacs_user_rights, user_rights 
where pacs_user_rights.pacs_user_right_id   = user_rights.user_right_id
and   pacs_user_rights.pacs_user_right_type = user_rights.user_right_type

GO

