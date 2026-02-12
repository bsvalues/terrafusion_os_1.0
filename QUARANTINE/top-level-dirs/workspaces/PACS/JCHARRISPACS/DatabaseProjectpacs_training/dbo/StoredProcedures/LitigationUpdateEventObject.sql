

create procedure LitigationUpdateEventObject
	@lLitigationEventObjectID int,
	@szObjectDesc varchar(512)
as

set nocount on

	update litigation_event_objects set
		object_desc = @szObjectDesc
	where
		litigation_event_object_id = @lLitigationEventObjectID

set nocount off

GO

