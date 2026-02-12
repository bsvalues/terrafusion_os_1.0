
CREATE PROCEDURE [dbo].[CopyWorkflowInstanceToPartition]	@WorkflowInstanceInternalId	bigint
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_CopyWorkflowInstanceToPartition_Failed nvarchar(256)
	set @localized_string_CopyWorkflowInstanceToPartition_Failed = N'CopyWorkflowInstanceToPartition failed'

	declare @localized_string_CopyWorkflowInstanceToPartition_Failed_No_Trans nvarchar(256)
	set @localized_string_CopyWorkflowInstanceToPartition_Failed_No_Trans = N'CopyWorkflowInstanceToPartition failed - a transaction is required.'

	declare @localized_string_CopyWorkflowInstanceToPartition_Failed_GetPartitionSet nvarchar(256)
	set @localized_string_CopyWorkflowInstanceToPartition_Failed_GetPartitionSet = N'CopyWorkflowInstanceToPartition failed calling GetPartitionSetNameForWorkflowInstance.'

	declare @localized_string_CopyWorkflowInstanceToPartition_Failed_Insert nvarchar(256)
	set @localized_string_CopyWorkflowInstanceToPartition_Failed_Insert = N'CopyWorkflowInstanceToPartition failed inserting workflow records into partition tables.'

	IF @@TRANCOUNT = 0
	 BEGIN
		SET @error_desc = @localized_string_CopyWorkflowInstanceToPartition_Failed_No_Trans
		GOTO FAILED
	 END


	DECLARE @PartitionSetName sysname

	EXEC @ret = [dbo].[GetPartitionSetNameForWorkflowInstance] @WorkflowInstanceInternalId = @WorkflowInstanceInternalId, @PartitionSetName = @PartitionSetName OUTPUT

	IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_CopyWorkflowInstanceToPartition_Failed_GetPartitionSet
		GOTO FAILED
	 END

	DECLARE		@string_id varchar(32)
	SELECT 		@string_id = cast( @WorkflowInstanceInternalId as varchar(32) ) 
	EXEC( 
	--print
	'
	DECLARE 	@WorkflowInstanceInternalId bigint
	SELECT		@WorkflowInstanceInternalId = ' + @string_id + '

	INSERT		WorkflowInstance_' + @PartitionSetName + '
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
	FROM		WorkflowInstance
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	INSERT		WorkflowInstanceEvent_' + @PartitionSetName + '
	SELECT		* 
	FROM		WorkflowInstanceEvent
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	-- In several cases the chance of having records is low
	-- The select check is faster if there are no record
	-- so the extra cost when there are records is a better overall balance
	IF EXISTS ( SELECT 1 FROM [dbo].[WorkflowInstanceEvent] WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId AND TrackingWorkflowEventId=11 /* Changed */ )
	 BEGIN
		INSERT		AddedActivity_' + @PartitionSetName + '
		SELECT		* 
		FROM		AddedActivity
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	
		INSERT		RemovedActivity_' + @PartitionSetName + '
		SELECT		* 
		FROM		RemovedActivity
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	 END

	IF EXISTS ( SELECT 1 FROM [dbo].[UserEvent] WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId )
	 BEGIN
		INSERT		UserEvent_' + @PartitionSetName + '
		SELECT		* 
		FROM		UserEvent
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	 END

	INSERT		ActivityInstance_' + @PartitionSetName + '
	SELECT		* 
	FROM		ActivityInstance
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	INSERT		ActivityExecutionStatusEvent_' + @PartitionSetName + '
	SELECT		* 
	FROM		ActivityExecutionStatusEvent
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	IF EXISTS ( SELECT 1 FROM [dbo].[TrackingDataItem] WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId )
	 BEGIN
		INSERT		TrackingDataItem_' + @PartitionSetName + '
		SELECT		* 
		FROM		TrackingDataItem
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	
		INSERT 		TrackingDataItemAnnotation_' + @PartitionSetName + '
		SELECT		* 
		FROM		TrackingDataItemAnnotation 
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	 END

	INSERT		EventAnnotation_' + @PartitionSetName + '
	SELECT		*
	FROM		EventAnnotation
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	')

	IF @@ERROR <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_CopyWorkflowInstanceToPartition_Failed_Insert
		GOTO FAILED
	 END

	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[CopyWorkflowInstanceToPartition] TO [tracking_writer]
    AS [dbo];


GO

