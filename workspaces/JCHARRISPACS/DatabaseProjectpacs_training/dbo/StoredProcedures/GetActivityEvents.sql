
CREATE PROCEDURE [dbo].[GetActivityEvents]		@WorkflowInstanceInternalId		bigint
												,@BeginDateTime					datetime
												,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetActivityEvents_Failed nvarchar(256)
	set @localized_string_GetActivityEvents_Failed = N'GetActivityEvents failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 			[ai].[QualifiedName]
					,[ase].[ExecutionStatusId]
					,[ase].[EventDateTime]
					,[ai].[ContextGuid]
					,[ai].[ParentContextGuid]
					,[ase].[EventOrder]
					,'TypeFullName' = 
					CASE
						WHEN [t1].[TypeFullName] IS NULL THEN [t2].[TypeFullName]
						ELSE [t1].[TypeFullName]
					END
					,'AssemblyFullName' = 
					CASE
						WHEN [t1].[AssemblyFullName] IS NULL THEN [t2].[AssemblyFullName]
						ELSE [t1].[AssemblyFullName]
					END
					,[ase].[ActivityExecutionStatusEventId]
					,[ase].[DbEventDateTime]
	FROM			[dbo].[vw_ActivityExecutionStatusEvent] [ase]
	INNER JOIN		[dbo].[vw_ActivityInstance] [ai]
	ON				[ase].[ActivityInstanceId] = [ai].[ActivityInstanceId]
	INNER JOIN		[dbo].[vw_WorkflowInstance] [wi]
	ON				[ai].[WorkflowInstanceInternalId] = [wi].[WorkflowInstanceInternalId]
	LEFT OUTER JOIN	[dbo].[vw_Activity] [a]
	ON				[wi].[WorkflowTypeId] = [a].[WorkflowTypeId]
	AND				[ai].[QualifiedName] = [a].[QualifiedName]
	LEFT OUTER JOIN	[dbo].[vw_Type] [t1]
	ON				[a].[ActivityTypeId] = [t1].[TypeId]
	LEFT OUTER JOIN	[dbo].[vw_AddedActivity] [aa]
	ON				[aa].[WorkflowInstanceEventId] = [ai].[WorkflowInstanceEventId]
	AND				[ai].[QualifiedName] = [aa].[QualifiedName]
	LEFT OUTER JOIN	[dbo].[vw_Type] [t2]
	ON				[aa].[ActivityTypeId] = [t2].[TypeId]
	WHERE			[ase].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND				[ase].[DbEventDateTime] > @BeginDateTime
	AND				[ase].[DbEventDateTime] <= @EndDateTime
	ORDER BY		[ase].[DbEventDateTime], [ase].[EventOrder]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE	

FAILED:
	RAISERROR( @localized_string_GetActivityEvents_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetActivityEvents] TO [tracking_reader]
    AS [dbo];


GO

