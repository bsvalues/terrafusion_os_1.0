
CREATE view ptd_ag_timber_report_vw

as

select distinct p.dataset_id, p.entity_id, e.entity_cd, a.file_as_name
from ptd_ag_timber_report as p
with (nolock)
join entity as e
with (nolock)
on p.entity_id = e.entity_id
join account as a
with (nolock)
on p.entity_id = a.acct_id

GO

