CREATE PROCEDURE [dbo].[DeleteTimeBasedSubscriptionSchedule]
@SubscriptionID as uniqueidentifier
as

delete ReportSchedule from ReportSchedule RS inner join Subscriptions S on S.[SubscriptionID] = RS.[SubscriptionID]
where
    S.[SubscriptionID] = @SubscriptionID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteTimeBasedSubscriptionSchedule] TO [RSExecRole]
    AS [dbo];


GO

