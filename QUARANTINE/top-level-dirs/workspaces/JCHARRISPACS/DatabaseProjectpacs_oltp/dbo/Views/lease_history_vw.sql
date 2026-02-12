

create view dbo.lease_history_vw
as

select
	ll.lease_chg_id,
	ll.lease_id,
	ll.lease_yr,
	ll.chg_desc,
	ll.chg_dt,
	pu.full_name
from
	lease_log as ll with (nolock)
inner join
	pacs_user as pu with (nolock)
on
	pu.pacs_user_id = ll.pacs_user_id

GO

