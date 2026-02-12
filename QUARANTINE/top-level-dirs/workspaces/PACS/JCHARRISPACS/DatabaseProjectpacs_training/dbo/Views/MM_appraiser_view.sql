

CREATE VIEW [dbo].[MM_appraiser_view] AS select appraiser_id,appraiser_nm,appraiser_full_name, isnull(p.pacs_user_name,'Not Associated') as pacs_user
from appraiser a
left join pacs_user p on
a.pacs_user_id=p.pacs_user_id
where ((isnull(a.inactive,'F')='F') or (a.inactive='0'))

GO

