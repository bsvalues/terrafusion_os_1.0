CREATE PROCEDURE [dbo].[DeleteActiveSubscription]
@ActiveID uniqueidentifier
AS

delete from ActiveSubscriptions where ActiveID = @ActiveID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteActiveSubscription] TO [RSExecRole]
    AS [dbo];


GO

