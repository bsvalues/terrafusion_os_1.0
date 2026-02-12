
CREATE PROCEDURE [dbo].[GetWorkflowInsertEventAnnotations]		@WorkflowInstanceInternalId		bigint
															,@BeginDateTime					datetime
															,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetWorkflowInsertEventAnnotations_Failed nvarchar(256)
	set @localized_string_GetWorkflowInsertEventAnnotations_Failed = N'GetWorkflowInsertEventAnnotations failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		[ea].[EventId]
				,[ea].[Annotation]
				,[we].[DbEventDateTime]
	FROM		[dbo].[vw_EventAnnotation] [ea]
	INNER JOIN	[dbo].[vw_WorkflowInstanceEvent] [we]
	ON			[ea].[WorkflowInstanceInternalId] = [we].[WorkflowInstanceInternalId]
	AND			[ea].[EventId] = [we].[WorkflowInstanceEventId]
	WHERE		[ea].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[ea].[EventTypeId] = 'w'
	AND			[we].[DbEventDateTime] > @BeginDateTime
	AND			[we].[DbEventDateTime] <= @EndDateTime
	ORDER BY	[we].[DbEventDateTime], [we].[EventOrder]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @localized_string_GetWorkflowInsertEventAnnotations_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetWorkflowInsertEventAnnotations] TO [tracking_reader]
    AS [dbo];


GO

