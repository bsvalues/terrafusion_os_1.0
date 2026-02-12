

create procedure LitigationDeleteEventObject
	@lEventObjectID int
as

set nocount on

	delete litigation_event_objects with(rowlock)
	where
		litigation_event_object_id = @lEventObjectID

set nocount off

GO

