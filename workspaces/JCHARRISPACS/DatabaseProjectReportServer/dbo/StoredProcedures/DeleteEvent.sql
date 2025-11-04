CREATE PROCEDURE [dbo].[DeleteEvent]
@ID uniqueidentifier
AS
delete from [Event] where [EventID] = @ID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteEvent] TO [RSExecRole]
    AS [dbo];


GO

