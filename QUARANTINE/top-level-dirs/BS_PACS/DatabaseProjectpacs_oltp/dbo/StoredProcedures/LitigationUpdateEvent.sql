

create procedure LitigationUpdateEvent
	@lEventID int,
	@szEventDesc varchar(512)
as

set nocount on

	update litigation_events with(rowlock) set
		event_description = @szEventDesc
	where
		litigation_event_id = @lEventID

set nocount off

GO

