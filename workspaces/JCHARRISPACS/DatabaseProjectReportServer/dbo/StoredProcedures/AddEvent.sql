CREATE PROCEDURE [dbo].[AddEvent]
@EventType nvarchar (260),
@EventData nvarchar (260)
AS

insert into [Event]
    ([EventID], [EventType], [EventData], [TimeEntered], [ProcessStart], [BatchID])
values
    (NewID(), @EventType, @EventData, GETUTCDATE(), NULL, NULL)

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[AddEvent] TO [RSExecRole]
    AS [dbo];


GO

