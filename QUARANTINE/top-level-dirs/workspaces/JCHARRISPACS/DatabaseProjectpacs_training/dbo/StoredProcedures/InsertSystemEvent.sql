
CREATE PROCEDURE InsertSystemEvent
	@event_type_cd 	varchar(5),
	@event_desc		varchar(2048),
	@lPacsUserID int = 9999
AS

	declare @next_system_event_id int

	exec dbo.GetUniqueID 'system_events', @next_system_event_id output, 1, 0

	INSERT INTO system_events
	(event_cd, event_desc, event_date, event_user_id, event_id)
	VALUES
	(@event_type_cd, @event_desc, getdate(), @lPacsUserID, @next_system_event_id)

GO

