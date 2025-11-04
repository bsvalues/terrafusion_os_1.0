
CREATE PROCEDURE [dbo].[GetWorkflowInstanceEvents]	@WorkflowInstanceInternalId		bigint
													,@BeginDateTime					datetime
													,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetWorkflowInstanceEvents_Failed nvarchar(256)
	set @localized_string_GetWorkflowInstanceEvents_Failed = N'GetWorkflowInstanceEvents failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		cast([TrackingWorkflowEventId]as int)
				,[EventDateTime]
				,[EventOrder]
				,[EventArg]
				,[WorkflowInstanceEventId]
				,[DbEventDateTime]
	FROM		[dbo].[vw_WorkflowInstanceEvent]
	WHERE		[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[DbEventDateTime] > @BeginDateTime
	AND			[DbEventDateTime] <= @EndDateTime
	ORDER BY	[WorkflowInstanceEventId]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE	

FAILED:
	RAISERROR( @localized_string_GetWorkflowInstanceEvents_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetWorkflowInstanceEvents] TO [tracking_reader]
    AS [dbo];


GO

