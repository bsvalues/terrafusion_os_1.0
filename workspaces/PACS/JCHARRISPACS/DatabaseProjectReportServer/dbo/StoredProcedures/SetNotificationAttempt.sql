CREATE PROCEDURE [dbo].[SetNotificationAttempt]
@Attempt int,
@SecondsToAdd int,
@NotificationID uniqueidentifier
AS

update
    [Notifications]
set
    [ProcessStart] = NULL,
    [Attempt] = @Attempt,
    [ProcessAfter] = DateAdd(second, @SecondsToAdd, GetUtcDate())
where
    [NotificationID] = @NotificationID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetNotificationAttempt] TO [RSExecRole]
    AS [dbo];


GO

