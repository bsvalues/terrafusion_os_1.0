
CREATE PROCEDURE [dbo].[GetActivityTrackingDataItemAnnotations]		@WorkflowInstanceInternalId		bigint
															,@BeginDateTime					datetime
															,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetActivityTrackingDataItemAnnotations_Failed nvarchar(256)
	set @localized_string_GetActivityTrackingDataItemAnnotations_Failed = N'GetActivityTrackingDataItemAnnotations failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		[aa].[TrackingDataItemId]
				,[aa].[Annotation]
				,[ase].[DbEventDateTime]
	FROM		[dbo].[vw_TrackingDataItemAnnotation] [aa]
	INNER JOIN	[dbo].[vw_TrackingDataItem] [a]
	ON			[aa].[TrackingDataItemId] = [a].[TrackingDataItemId]
	INNER JOIN	[dbo].[vw_ActivityExecutionStatusEvent] [ase]
	ON			[a].[WorkflowInstanceInternalId] = [ase].[WorkflowInstanceInternalId]
	AND			[a].[EventId] = [ase].[ActivityExecutionStatusEventId]
	WHERE		[a].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[a].[EventTypeId] = 'a'
	AND			[ase].[DbEventDateTime] > @BeginDateTime
	AND			[ase].[DbEventDateTime] <= @EndDateTime
	ORDER BY	[ase].[DbEventDateTime], [ase].[EventOrder]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE	

FAILED:
	RAISERROR( @localized_string_GetActivityTrackingDataItemAnnotations_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetActivityTrackingDataItemAnnotations] TO [tracking_reader]
    AS [dbo];


GO

