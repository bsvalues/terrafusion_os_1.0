
CREATE PROCEDURE [dbo].[GetActivityTrackingDataItems]		@WorkflowInstanceInternalId		bigint
															,@BeginDateTime					datetime
															,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetActivityTrackingDataItems_Failed nvarchar(256)
	set @localized_string_GetActivityTrackingDataItems_Failed = N'GetActivityTrackingDataItems failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		[a].[EventId]
				,[a].[TrackingDataItemId]
				,[a].[FieldName]
				,[a].[Data_Str]
				,[a].[Data_Blob]
				,[ase].[DbEventDateTime]
	FROM		[dbo].[vw_TrackingDataItem] [a]
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
	RAISERROR( @localized_string_GetActivityTrackingDataItems_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetActivityTrackingDataItems] TO [tracking_reader]
    AS [dbo];


GO

