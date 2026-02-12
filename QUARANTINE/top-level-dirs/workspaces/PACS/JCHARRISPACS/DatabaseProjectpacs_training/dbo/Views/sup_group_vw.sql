

create view sup_group_vw
as
select
	sg.sup_group_id,
	sg.sup_group_desc,
	sg.sup_create_dt,
	sg.sup_arb_ready_dt,
	sg.sup_accept_dt,
	sg.sup_bill_create_dt,
	ltrim(rtrim(isnull(sg.status_cd, ''))) as status_cd,
	ltrim(rtrim(isnull(ss.status_desc, ''))) as status_desc,
	sg.sup_accept_by_id,
	accept_by_user.pacs_user_name as accept_by_user_name,
	accept_by_user.full_name as accept_by_user_full_name,
	sg.sup_bills_created_by_id,
	bills_created_by_user.pacs_user_name as bills_created_by_user_name,
	bills_created_by_user.full_name as bills_created_by_full_name
from
	sup_group as sg with (nolock)
inner join
	supplement as s with (nolock)
on
	s.sup_group_id = sg.sup_group_id
left outer join
	supp_status as ss with (nolock)
on
	ltrim(rtrim(isnull(ss.status_cd, ''))) = ltrim(rtrim(isnull(sg.status_cd, '')))
left outer join
	pacs_user as accept_by_user with (nolock)
on
	accept_by_user.pacs_user_id = sg.sup_accept_by_id
left outer join
	pacs_user as bills_created_by_user with (nolock)
on
	bills_created_by_user.pacs_user_id = sg.sup_bills_created_by_id
group by
	sg.sup_group_id,
	sg.sup_group_desc,
	sg.sup_create_dt,
	sg.sup_arb_ready_dt,
	sg.sup_accept_dt,
	sg.sup_bill_create_dt,
	ltrim(rtrim(isnull(sg.status_cd, ''))),
	ltrim(rtrim(isnull(ss.status_desc, ''))),
	sg.sup_accept_by_id,
	accept_by_user.pacs_user_name,
	accept_by_user.full_name,
	sg.sup_bills_created_by_id,
	bills_created_by_user.pacs_user_name,
	bills_created_by_user.full_name

GO

