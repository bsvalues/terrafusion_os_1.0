

create procedure LitigationGetEvents
	@lLitigationID int
as

	select
		l.litigation_event_id, l.event_dt, l.event_cd, l.event_description, u.pacs_user_name
	from litigation_events as l with(nolock)
	join pacs_user as u with(nolock) on
		l.pacs_user_id = u.pacs_user_id
	where
		litigation_id = @lLitigationID
	order by l.event_dt desc, l.litigation_event_id desc

GO

