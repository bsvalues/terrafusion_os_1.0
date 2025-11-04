

create procedure LitigationGetEventObjects
	@lEventID int
as

	select
		l.litigation_event_object_id, l.date_created, l.object_path, l.object_desc, u.pacs_user_name
	from litigation_event_objects as l with(nolock)
	join pacs_user as u with(nolock) on
		l.pacs_user_id = u.pacs_user_id
	where
		l.litigation_event_id = @lEventID
	order by
		l.litigation_event_object_id asc

GO

