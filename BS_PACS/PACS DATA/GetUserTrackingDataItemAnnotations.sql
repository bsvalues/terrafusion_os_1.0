
CREATE PROCEDURE [dbo].[GetUserTrackingDataItemAnnotations]		@WorkflowInstanceInternalId		bigint
														,@BeginDateTime					datetime
														,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetUserTrackingDataItemAnnotations_Failed nvarchar(256)
	set @localized_string_GetUserTrackingDataItemAnnotations_Failed = N'GetUserTrackingDataItemAnnotations failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		[aa].[TrackingDataItemId]
				,[aa].[Annotation]
				,[ue].[DbEventDateTime]
	FROM		[dbo].[vw_TrackingDataItemAnnotation] [aa]
	INNER JOIN	[dbo].[vw_TrackingDataItem] [a]
	ON			[aa].[TrackingDataItemId] = [a].[TrackingDataItemId]
	INNER JOIN	[dbo].[vw_UserEvent] [ue]
	ON			[a].[WorkflowInstanceInternalId] = [ue].[WorkflowInstanceInternalId]
	AND			[a].[EventId] = [ue].[UserEventId]
	WHERE		[a].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[a].[EventTypeId] = 'u'
	AND			[ue].[DbEventDateTime] > @BeginDateTime
	AND			[ue].[DbEventDateTime] <= @EndDateTime
	ORDER BY	[ue].[DbEventDateTime], [ue].[EventOrder]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE	

FAILED:
	RAISERROR( @localized_string_GetUserTrackingDataItemAnnotations_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUserTrackingDataItemAnnotations] TO [tracking_reader]
    AS [dbo];


GO

