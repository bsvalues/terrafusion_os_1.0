
CREATE PROCEDURE [dbo].[GetUserTrackingDataItems]		@WorkflowInstanceInternalId		bigint
													,@BeginDateTime					datetime
													,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetUserTrackingDataItems_Failed nvarchar(256)
	set @localized_string_GetUserTrackingDataItems_Failed = N'GetUserTrackingDataItems failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		[a].[EventId]
				,[a].[TrackingDataItemId]
				,[a].[FieldName]
				,[a].[Data_Str]
				,[a].[Data_Blob]
				,[ue].[DbEventDateTime]
	FROM		[dbo].[vw_TrackingDataItem] [a]
	INNER JOIN	[dbo].[vw_UserEvent] [ue]
	ON			[a].[WorkflowInstanceInternalId] = [ue].[WorkflowInstanceInternalId]
	AND			[a].[EventId] = [ue].[UserEventId]
	WHERE		[a].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[a].[EventTypeId]='u'
	AND			[ue].[DbEventDateTime] > @BeginDateTime
	AND			[ue].[DbEventDateTime] <= @EndDateTime
	ORDER BY	[ue].[DbEventDateTime], [ue].[EventOrder]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE	

FAILED:
	RAISERROR( @localized_string_GetUserTrackingDataItems_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUserTrackingDataItems] TO [tracking_reader]
    AS [dbo];


GO

