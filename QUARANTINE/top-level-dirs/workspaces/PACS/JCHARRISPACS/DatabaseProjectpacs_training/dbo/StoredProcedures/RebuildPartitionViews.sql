
CREATE PROCEDURE [dbo].[RebuildPartitionViews]
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_RebuildPartitionViews_Failed nvarchar(256)
	set @localized_string_RebuildPartitionViews_Failed = N'RebuildPartitionViews failed'
	
	declare @localized_string_RebuildPartitionViews_Failed_Drop nvarchar(256)
	set @localized_string_RebuildPartitionViews_Failed_Drop = N'RebuildPartitionViews failed calling TrackingPartition_DropPartitionViews'
	
	declare	@WorkflowInstance 		varchar(8000)
			,@ActivityInstance		varchar(8000)
			,@ActivityExecutionStatusEvent	varchar(8000)
			,@WorkflowInstanceEvent	varchar(8000)
			,@UserEvent				varchar(8000)
			,@TrackingDataItem				varchar(8000)
			,@TrackingDataItemAnnotation	varchar(8000)
			,@EventAnnotation		varchar(8000)
			,@AddedActivity			varchar(8000)
			,@RemovedActivity		varchar(8000)
			,@Name					varchar(32)

	
	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END
	
	-- Drop the views
	EXEC @ret = [dbo].[TrackingPartition_DropPartitionViews]

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @error <> 0
	 BEGIN
		SET @error_desc = @localized_string_RebuildPartitionViews_Failed_Drop
		GOTO FAILED
	 END

	-- Define each view with its corresponding base table
	SELECT @WorkflowInstance = '
		CREATE VIEW [dbo].[vw_WorkflowInstance]
		AS
		SELECT		[WorkflowInstanceInternalId]
					,[WorkflowInstanceId]
					,[ContextGuid]
					,[CallerInstanceId]
					,[CallPath]
					,[CallerContextGuid]
					,[CallerParentContextGuid]
					,[WorkflowTypeId]
					,[InitializedDateTime]
					,[DbInitializedDateTime]
					,[EndDateTime]
					,[DbEndDateTime]
		FROM		[dbo].[WorkflowInstance] '

	SELECT @ActivityInstance = '
		CREATE VIEW [dbo].[vw_ActivityInstance]
		AS
		SELECT		[WorkflowInstanceInternalId]
					,[ActivityInstanceId]
					,[QualifiedName]
					,[ContextGuid]
					,[ParentContextGuid]
					,[WorkflowInstanceEventId]
		FROM		[dbo].[ActivityInstance] '

	SELECT @ActivityExecutionStatusEvent = '	
		CREATE VIEW [dbo].[vw_ActivityExecutionStatusEvent]
		AS
		SELECT		[ActivityExecutionStatusEventId]
					,[WorkflowInstanceInternalId]
					,[EventOrder]				
					,[ActivityInstanceId]		
					,[ExecutionStatusId]					
					,[EventDateTime]
					,[DbEventDateTime]
		FROM		[dbo].[ActivityExecutionStatusEvent] '

	SELECT @WorkflowInstanceEvent = '
		CREATE VIEW [dbo].[vw_WorkflowInstanceEvent]
		AS
		SELECT		[WorkflowInstanceEventId]	
					,[WorkflowInstanceInternalId]
					,[TrackingWorkflowEventId]
					,[EventDateTime]	
					,[EventOrder]		
					,[EventArgTypeId]		
					,[EventArg]
					,[DbEventDateTime]
		FROM		[dbo].[WorkflowInstanceEvent] '

	SELECT @UserEvent = '	
		CREATE VIEW [dbo].[vw_UserEvent]
		AS
		SELECT		[UserEventId]
					,[WorkflowInstanceInternalId]
					,[EventOrder]
					,[ActivityInstanceId]
					,[EventDateTime]
					,[UserDataKey]
					,[UserDataTypeId]
					,[UserData_Str]
					,[UserData_Blob]
					,[UserDataNonSerializable]
					,[DbEventDateTime]
		FROM		[dbo].[UserEvent] '

	SELECT @TrackingDataItem = '		
		CREATE VIEW [dbo].[vw_TrackingDataItem]
		AS
		SELECT		[TrackingDataItemId]
					,[WorkflowInstanceInternalId]
					,[EventId]
					,[EventTypeId]
					,[FieldName]
					,[FieldTypeId]
					,[Data_Str]
					,[Data_Blob]
					,[DataNonSerializable]
		FROM		[dbo].[TrackingDataItem] '

	SELECT @TrackingDataItemAnnotation = '
		CREATE VIEW [dbo].[vw_TrackingDataItemAnnotation]
		AS
		SELECT		[TrackingDataItemId]
					,[WorkflowInstanceInternalId]
					,[Annotation]
		FROM		[dbo].[TrackingDataItemAnnotation] '

	SELECT @EventAnnotation = '	
		CREATE VIEW [dbo].[vw_EventAnnotation]
		AS
		SELECT		[WorkflowInstanceInternalId]
					,[EventId]
					,[EventTypeId]
					,[Annotation]
		FROM 		[dbo].[EventAnnotation] '

	SELECT @AddedActivity = '
		CREATE VIEW [dbo].[vw_AddedActivity]
		AS
		SELECT		[WorkflowInstanceInternalId]
					,[WorkflowInstanceEventId]
					,[QualifiedName]
					,[ActivityTypeId]
					,[ParentQualifiedName]
					,[AddedActivityAction]
					,[Order]
		FROM		[dbo].[AddedActivity] '

	SELECT @RemovedActivity = '	
		CREATE VIEW [dbo].[vw_RemovedActivity]
		AS
		SELECT		[WorkflowInstanceInternalId]
					,[WorkflowInstanceEventId]
					,[QualifiedName]
					,[ParentQualifiedName]
					,[RemovedActivityAction]
					,[Order]
		FROM		[dbo].[RemovedActivity] '

	declare partition_cursor CURSOR FOR
	SELECT	[Name]
	FROM	[dbo].[TrackingPartitionSetName]

	OPEN partition_cursor

	FETCH NEXT FROM partition_cursor INTO @Name

	-- For each partition add a UNION ALL clause for it to each view
	WHILE @@FETCH_STATUS = 0
	 BEGIN
		SELECT @WorkflowInstance = @WorkflowInstance + '
		UNION ALL
		SELECT		[WorkflowInstanceInternalId]
					,[WorkflowInstanceId]
					,[ContextGuid]
					,[CallerInstanceId]
					,[CallPath]
					,[CallerContextGuid]
					,[CallerParentContextGuid]
					,[WorkflowTypeId]
					,[InitializedDateTime]
					,[DbInitializedDateTime]
					,[EndDateTime]
					,[DbEndDateTime]
		FROM		[dbo].[WorkflowInstance_' + @Name +'] '

		SELECT @ActivityInstance = @ActivityInstance + '
		UNION ALL 
		SELECT		[WorkflowInstanceInternalId]
					,[ActivityInstanceId]
					,[QualifiedName]
					,[ContextGuid]
					,[ParentContextGuid]
					,[WorkflowInstanceEventId]
		FROM		[dbo].[ActivityInstance_' + @Name + '] '
		
		SELECT @ActivityExecutionStatusEvent = @ActivityExecutionStatusEvent + '	
		UNION ALL
		SELECT		[ActivityExecutionStatusEventId]
					,[WorkflowInstanceInternalId]
					,[EventOrder]				
					,[ActivityInstanceId]		
					,[ExecutionStatusId]					
					,[EventDateTime]
					,[DbEventDateTime]
		FROM		[dbo].[ActivityExecutionStatusEvent_' + @Name + '] '
		
		SELECT @WorkflowInstanceEvent = @WorkflowInstanceEvent + '
		UNION ALL
		SELECT		[WorkflowInstanceEventId]	
					,[WorkflowInstanceInternalId]
					,[TrackingWorkflowEventId]
					,[EventDateTime]	
					,[EventOrder]		
					,[EventArgTypeId]		
					,[EventArg]
					,[DbEventDateTime]
		FROM		[dbo].[WorkflowInstanceEvent_' + @Name + '] '

		SELECT @UserEvent = @UserEvent + '	
		UNION ALL
		SELECT		[UserEventId]
					,[WorkflowInstanceInternalId]
					,[EventOrder]
					,[ActivityInstanceId]
					,[EventDateTime]
					,[UserDataKey]
					,[UserDataTypeId]
					,[UserData_Str]
					,[UserData_Blob]
					,[UserDataNonSerializable]
					,[DbEventDateTime]
		FROM		[dbo].[UserEvent_' + @Name + '] '
		
		SELECT @TrackingDataItem = @TrackingDataItem + '		
		UNION ALL
		SELECT		[TrackingDataItemId]
					,[WorkflowInstanceInternalId]
					,[EventId]
					,[EventTypeId]
					,[FieldName]
					,[FieldTypeId]
					,[Data_Str]
					,[Data_Blob]
					,[DataNonSerializable]
		FROM		[dbo].[TrackingDataItem_' + @Name + '] '
		
		SELECT @TrackingDataItemAnnotation = @TrackingDataItemAnnotation + '
		UNION ALL
		SELECT		[TrackingDataItemId]
					,[WorkflowInstanceInternalId]					
					,[Annotation]
		FROM		[dbo].[TrackingDataItemAnnotation_' + @Name + '] '

		SELECT @EventAnnotation = @EventAnnotation + '	
		UNION ALL
		SELECT		[WorkflowInstanceInternalId]
					,[EventId]
					,[EventTypeId]
					,[Annotation]
		FROM 		[dbo].[EventAnnotation_' + @Name + '] '

		SELECT @AddedActivity = @AddedActivity + '
		UNION ALL
		SELECT		[WorkflowInstanceInternalId]
					,[WorkflowInstanceEventId]
					,[QualifiedName]
					,[ActivityTypeId]
					,[ParentQualifiedName]
					,[AddedActivityAction]
					,[Order]
		FROM		[dbo].[AddedActivity_' + @Name + '] '

		SELECT @RemovedActivity = @RemovedActivity + '	
		UNION ALL
		SELECT		[WorkflowInstanceInternalId]
					,[WorkflowInstanceEventId]
					,[QualifiedName]
					,[ParentQualifiedName]
					,[RemovedActivityAction]
					,[Order]
		FROM		[dbo].[RemovedActivity_' + @Name + '] '

		FETCH NEXT FROM partition_cursor INTO @Name
	 END -- cursor loop

	CLOSE partition_cursor
	DEALLOCATE partition_cursor

	-- Execute all of the CREATE statements

	EXEC( @WorkflowInstance )

	EXEC( @ActivityInstance )

	EXEC( @ActivityExecutionStatusEvent )

	EXEC( @UserEvent )

	EXEC( @WorkflowInstanceEvent )

	EXEC( @TrackingDataItem )

	EXEC( @TrackingDataItemAnnotation )

	EXEC( @EventAnnotation )

	EXEC( @AddedActivity )
	
	EXEC( @RemovedActivity )


	-- Grant select for each of the rebuilt views
	GRANT SELECT ON [dbo].[vw_WorkflowInstance] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_ActivityInstance] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_ActivityExecutionStatusEvent] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_UserEvent] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_WorkflowInstanceEvent] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_TrackingDataItem] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_TrackingDataItemAnnotation] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_EventAnnotation] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_AddedActivity] TO tracking_reader 
	GRANT SELECT ON [dbo].[vw_RemovedActivity] TO tracking_reader

	IF @local_tran = 1
		COMMIT TRANSACTION

	SET @ret = 0
	GOTO DONE

FAILED:
	IF @local_tran = 1
		ROLLBACK TRANSACTION

	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RebuildPartitionViews] TO [tracking_writer]
    AS [dbo];


GO

