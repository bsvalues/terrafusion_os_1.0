CREATE PROCEDURE [dbo].[DeleteNotification]
@ID uniqueidentifier
AS
delete from [Notifications] where [NotificationID] = @ID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteNotification] TO [RSExecRole]
    AS [dbo];


GO

