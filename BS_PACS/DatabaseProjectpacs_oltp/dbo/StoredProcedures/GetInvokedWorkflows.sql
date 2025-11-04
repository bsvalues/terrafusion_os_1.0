
CREATE PROCEDURE [dbo].[GetInvokedWorkflows]		@WorkflowInstanceId				uniqueidentifier
													,@BeginDateTime					datetime
													,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetInvokedWorkflows_Failed nvarchar(256)
	set @localized_string_GetInvokedWorkflows_Failed = N'GetInvokedWorkflows failed.'

	DECLARE @error int, @ret int

	SELECT 			'CurrentEventTimeStamp' = GetUTCDate()
					,[wi].[WorkflowInstanceId]
					,[wi].[WorkflowInstanceInternalId]
					,[wi].[InitializedDateTime]
					,[wi].[CallerInstanceId]
					,'WorkflowStatus' = 
					CASE
						WHEN [wie].[TrackingWorkflowEventId] = 2 	THEN cast(1 as int) /* Completed */
						WHEN [wie].[TrackingWorkflowEventId] = 4 	THEN cast(2 as int) /* Suspended */
						WHEN [wie].[TrackingWorkflowEventId] = 10 	THEN cast(3 as int) /* Terminated */
						ELSE cast(0 as int) /* Running */
					END
					,[t].[TypeFullName]
					,[t].[AssemblyFullName]
	FROM			[vw_WorkflowInstance] [wi]
	INNER JOIN		[dbo].[vw_Type] [t]
	ON				[wi].[WorkflowTypeId] = [t].[TypeId]
	LEFT OUTER JOIN	[dbo].[vw_WorkflowInstanceEvent] [wie]
	ON				[wi].[WorkflowInstanceInternalId] = [wie].[WorkflowInstanceInternalId] 
	WHERE			( [wie].[EventOrder] = 
						( 
							SELECT  max([EventOrder])
				            FROM  	[dbo].[vw_WorkflowInstanceEvent] [wie2]
				            WHERE  	[wie2].[WorkflowInstanceInternalId] = [wie].[WorkflowInstanceInternalId]
							AND		[wie2].[TrackingWorkflowEventId] != 6
						)
					OR [wie].[EventOrder] IS NULL ) -- Profile might not track instance events 
	AND				[wi].[CallerInstanceId] = @WorkflowInstanceId
	AND				[wi].[InitializedDateTime] > @BeginDateTime
	AND				[wi].[InitializedDateTime] <= @EndDateTime


	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @localized_string_GetInvokedWorkflows_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetInvokedWorkflows] TO [tracking_reader]
    AS [dbo];


GO

