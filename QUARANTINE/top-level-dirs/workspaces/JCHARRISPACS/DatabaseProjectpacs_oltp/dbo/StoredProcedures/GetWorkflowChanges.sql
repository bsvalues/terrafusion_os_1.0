
CREATE PROCEDURE [dbo].[GetWorkflowChanges]		@WorkflowInstanceInternalId		bigint
												,@BeginDateTime					datetime
												,@EndDateTime					datetime
												,@MaxEventOrder					int = NULL
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetWorkflowChanges_Failed nvarchar(256)
	set @localized_string_GetWorkflowChanges_Failed = N'GetWorkflowChanges failed.'

	DECLARE @error int, @ret int, @rowcount int

	SELECT	TOP 1	([wie].[DbEventDateTime])
	FROM			[dbo].[vw_WorkflowInstanceEvent] [wie]
	WHERE			[wie].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND				[wie].[TrackingWorkflowEventId] = 11 --Changed
	AND				[wie].[DbEventDateTime] > @BeginDateTime
	AND				[wie].[DbEventDateTime] <= @EndDateTime
	ORDER BY		[wie].[DbEventDateTime] desc, [wie].[EventOrder]

	SELECT @rowcount = @@ROWCOUNT

	IF @rowcount = 0
		GOTO DONE

	-- Use a temp table to avoid sending unneeded columns back to the client 
	-- (union requires ordering items to be in the select list)
	IF OBJECT_ID('tempdb..#Changes') IS NOT NULL
		DROP TABLE #Changes	

	CREATE TABLE #Changes
	(
		[ActivityAction]			nvarchar(2000)	COLLATE database_default NOT NULL
		,[Order]					int				NOT NULL
		,[DbEventDateTime]			datetime		NOT NULL
		,[EventOrder]				int				NOT NULL
	)

	IF @MaxEventOrder IS NULL
	 BEGIN
		INSERT		#Changes
		SELECT 		[aa].[AddedActivityAction], [aa].[Order], [wie].[DbEventDateTime], [wie].[EventOrder]
		FROM		[dbo].[vw_AddedActivity] [aa]
		INNER JOIN	[dbo].[vw_WorkflowInstanceEvent] [wie]
		ON			[aa].[WorkflowInstanceEventId] = [wie].[WorkflowInstanceEventId]
		WHERE		[wie].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
		AND			[wie].[TrackingWorkflowEventId] = 11 --Changed
		AND			[wie].[DbEventDateTime] > @BeginDateTime
		AND			[wie].[DbEventDateTime] <= @EndDateTime
		AND			[aa].[AddedActivityAction] IS NOT NULL

		SELECT @error = @@ERROR

		IF @error IS NULL OR @error <> 0
		 BEGIN
			GOTO FAILED
		 END
	 END
	ELSE
	 BEGIN
		INSERT		#Changes
		SELECT 		[aa].[AddedActivityAction], [aa].[Order], [wie].[DbEventDateTime], [wie].[EventOrder]
		FROM		[dbo].[vw_AddedActivity] [aa]
		INNER JOIN	[dbo].[vw_WorkflowInstanceEvent] [wie]
		ON			[aa].[WorkflowInstanceEventId] = [wie].[WorkflowInstanceEventId]
		WHERE		[wie].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
		AND			[wie].[TrackingWorkflowEventId] = 11 --Changed
		AND			[wie].[DbEventDateTime] > @BeginDateTime
		AND			[wie].[DbEventDateTime] <= @EndDateTime
		AND			[wie].[EventOrder] <= @MaxEventOrder
		AND			[aa].[AddedActivityAction] IS NOT NULL

		SELECT @error = @@ERROR

		IF @error IS NULL OR @error <> 0
		 BEGIN
			GOTO FAILED
		 END
	 END

	IF @MaxEventOrder IS NULL
	 BEGIN
		INSERT		#Changes
		SELECT 		[ra].[RemovedActivityAction], [ra].[Order], [wie].[DbEventDateTime], [wie].[EventOrder]
		FROM		[dbo].[vw_RemovedActivity] [ra]
		INNER JOIN	[dbo].[vw_WorkflowInstanceEvent] [wie]
		ON			[ra].[WorkflowInstanceEventId] = [wie].[WorkflowInstanceEventId]
		WHERE		[wie].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
		AND			[wie].[TrackingWorkflowEventId] = 11 --Changed
		AND			[wie].[DbEventDateTime] > @BeginDateTime
		AND			[wie].[DbEventDateTime] <= @EndDateTime
		AND			[ra].[RemovedActivityAction] IS NOT NULL
		
		SELECT @error = @@ERROR

		IF @error IS NULL OR @error <> 0
		 BEGIN
			GOTO FAILED
		 END
	 END
	ELSE
	 BEGIN
		INSERT		#Changes
		SELECT 		[ra].[RemovedActivityAction], [ra].[Order], [wie].[DbEventDateTime], [wie].[EventOrder]
		FROM		[dbo].[vw_RemovedActivity] [ra]
		INNER JOIN	[dbo].[vw_WorkflowInstanceEvent] [wie]
		ON			[ra].[WorkflowInstanceEventId] = [wie].[WorkflowInstanceEventId]
		WHERE		[wie].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
		AND			[wie].[TrackingWorkflowEventId] = 11 --Changed
		AND			[wie].[DbEventDateTime] > @BeginDateTime
		AND			[wie].[DbEventDateTime] <= @EndDateTime
		AND			[wie].[EventOrder] <= @MaxEventOrder
		AND			[ra].[RemovedActivityAction] IS NOT NULL
		
		SELECT @error = @@ERROR

		IF @error IS NULL OR @error <> 0
		 BEGIN
			GOTO FAILED
		 END
	 END

	SELECT		[ActivityAction], [DbEventDateTime], [EventOrder], [Order]
	FROM		#Changes
	ORDER BY	[DbEventDateTime] asc, [EventOrder] asc, [Order] asc

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0
	 BEGIN
		GOTO FAILED
	 END
	
	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @localized_string_GetWorkflowChanges_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	IF OBJECT_ID('tempdb..#Changes') IS NOT NULL
		DROP TABLE #Changes	

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetWorkflowChanges] TO [tracking_reader]
    AS [dbo];


GO

