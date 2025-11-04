

create view mineral_import_pacs_entity_vw
as
select
	e.entity_id,
	e.entity_cd,
	a.file_as_name as entity_name
from
	dbo.entity as e with (nolock)
join
	dbo.account as a with (nolock)
on
	a.acct_id = e.entity_id
where
	isnull(e.rendition_entity, 0) = 0

GO

