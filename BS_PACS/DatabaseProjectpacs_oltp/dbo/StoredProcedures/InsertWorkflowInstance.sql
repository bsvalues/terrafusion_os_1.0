
CREATE PROCEDURE [dbo].[InsertWorkflowInstance]		@WorkflowInstanceId					uniqueidentifier	
													,@TypeFullName						nvarchar(128)
													,@AssemblyFullName					nvarchar(256)
													,@ContextGuid						uniqueidentifier
													,@CallerInstanceId					uniqueidentifier	= NULL
													,@CallPath							nvarchar(400)		= NULL
													,@CallerContextGuid					uniqueidentifier	= NULL
													,@CallerParentContextGuid			uniqueidentifier	= NULL
													,@EventDateTime						datetime
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			smallint
			,@aid			bigint
			,@ParentId		bigint
			,@WorkflowInstanceInternalId bigint

	declare @localized_string_InsertWorkflowInstance_Failed_GetType nvarchar(256)
	set @localized_string_InsertWorkflowInstance_Failed_GetType = N'InsertWorkflowInstance failed calling procedure GetTypeId'

	declare @localized_string_InsertWorkflowInstance_Failed_InsertingWorkflowInstance nvarchar(256)
	set @localized_string_InsertWorkflowInstance_Failed_InsertingWorkflowInstance = N'InsertWorkflowInstance failed inserting into WorkflowInstance'

	declare @localized_string_InsertWorkflowInstance_Failed_InvalidStatus nvarchar(256)
	set @localized_string_InsertWorkflowInstance_Failed_InvalidStatus = N'Status is not Executing'

	declare @localized_string_InsertWorkflowInstance_Failed_SelectingParentId nvarchar(256)
	set @localized_string_InsertWorkflowInstance_Failed_SelectingParentId = N'Failed selecting parent WorkflowInstanceInternalId'

	declare @localized_string_InsertWorkflowInstance_Failed_InsertActivityExecutionStatusEvent nvarchar(256)
	set @localized_string_InsertWorkflowInstance_Failed_InsertActivityExecutionStatusEvent = N'InsertActivityExecutionStatusEvent failed'

	declare @localized_string_InsertWorkflowInstance_Failed_WorkflowInstanceInternalId nvarchar(256)
	set @localized_string_InsertWorkflowInstance_Failed_WorkflowInstanceInternalId = N'Failed calling GetExistingWorkflowInstanceInternalId'

	declare @localized_string_InsertWorkflowInstance_Failed_NoWorkflowInstanceInternalId nvarchar(256)
	set @localized_string_InsertWorkflowInstance_Failed_NoWorkflowInstanceInternalId = N'Failed - @WorkflowInstanceInternalId is null or empty at exit'


	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END

	DECLARE @WorkflowTypeId smallint
	IF @TypeFullName IS NOT NULL AND @AssemblyFullName IS NOT NULL
	 BEGIN
		/*
			Look up or insert the type of the Workflow
		*/
		EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @TypeFullName
										,@AssemblyFullName	= @AssemblyFullName
										,@TypeId			= @WorkflowTypeId OUTPUT
		
		IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @WorkflowTypeId IS NULL
		 BEGIN
			SELECT @error_desc = @localized_string_InsertWorkflowInstance_Failed_GetType
			GOTO FAILED
		 END
	 END
	/*
		Determine if we already have a record for this
		If it already exists this is a load call, just return with the internal id
	*/
	EXEC @ret = [dbo].[GetWorkflowInstanceInternalId]	@WorkflowInstanceId					= @WorkflowInstanceId
														,@ContextGuid						= @ContextGuid
														,@WorkflowInstanceInternalId		= @WorkflowInstanceInternalId OUTPUT

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_InsertWorkflowInstance_Failed_WorkflowInstanceInternalId
		GOTO FAILED
	 END

	IF @WorkflowInstanceInternalId IS NULL
	 BEGIN
		/*
			Insert into the WorkflowInstance table
		*/
		INSERT [dbo].[WorkflowInstance] (
				[WorkflowInstanceId]
				,[ContextGuid]
				,[CallerInstanceId]
				,[CallPath]
				,[CallerContextGuid]
				,[CallerParentContextGuid]
				,[WorkflowTypeId]
				,[InitializedDateTime]
		) VALUES (
				@WorkflowInstanceId
				,@ContextGuid
				,@CallerInstanceId
				,@CallPath
				,@CallerContextGuid
				,@CallerParentContextGuid
				,@WorkflowTypeId
				,@EventDateTime
		)
	
		SELECT 	@WorkflowInstanceInternalId = SCOPE_IDENTITY()
				,@error = @@ERROR
	
		IF @error IS NULL OR @error <> 0
		 BEGIN
			SELECT @error_desc = @localized_string_InsertWorkflowInstance_Failed_InsertingWorkflowInstance
			GOTO FAILED
		 END
	 END

	/*
		We should always have an internal id at this point
	*/
	IF @WorkflowInstanceInternalId IS NULL OR @WorkflowInstanceInternalId <= 0
	 BEGIN
		SELECT @error_desc = @localized_string_InsertWorkflowInstance_Failed_NoWorkflowInstanceInternalId
		GOTO FAILED
	 END

	SELECT @WorkflowInstanceInternalId as 'WorkflowInstanceInternalId'
	

	IF @local_tran = 1
		COMMIT TRANSACTION

	SELECT	@ret = 0

	GOTO DONE

FAILED:
	IF @local_tran = 1
		ROLLBACK TRANSACTION

	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	return @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertWorkflowInstance] TO [tracking_writer]
    AS [dbo];


GO

