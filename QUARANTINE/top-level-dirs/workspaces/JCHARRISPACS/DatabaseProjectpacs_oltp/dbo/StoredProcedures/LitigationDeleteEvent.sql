

create procedure LitigationDeleteEvent
	@lEventID int
as

set nocount on

	delete litigation_event_objects with(rowlock)
	where
		litigation_event_id = @lEventID

	delete litigation_events with(rowlock)
	where
		litigation_event_id = @lEventID

set nocount off

GO

