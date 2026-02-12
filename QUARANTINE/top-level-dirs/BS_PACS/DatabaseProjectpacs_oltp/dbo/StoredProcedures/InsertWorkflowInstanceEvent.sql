
CREATE PROCEDURE [dbo].[InsertWorkflowInstanceEvent]	@WorkflowInstanceInternalId		bigint
														,@TrackingWorkflowEventId1		smallint
														,@EventDateTime1				datetime
														,@EventOrder1					int	
														,@EventArgTypeFullName1			nvarchar(128)=NULL
														,@EventArgAssemblyFullName1		nvarchar(256)=NULL
														,@EventArg1						image=NULL
														,@WorkflowInstanceEventId1		bigint=NULL OUTPUT
														,@TrackingWorkflowEventId2		smallint=NULL
														,@EventDateTime2				datetime=NULL
														,@EventOrder2					int=NULL
														,@EventArgTypeFullName2			nvarchar(128)=NULL
														,@EventArgAssemblyFullName2		nvarchar(256)=NULL
														,@EventArg2						image=NULL
														,@WorkflowInstanceEventId2		bigint=NULL OUTPUT
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	declare @localized_string_InsertWorkflowInstanceEvent_Failed_WorkflowInstanceEventInsert nvarchar(256)
	set @localized_string_InsertWorkflowInstanceEvent_Failed_WorkflowInstanceEventInsert = N'Failed inserting into WorkflowInstanceEvent'

	declare @localized_string_InsertWorkflowInstanceEvent_Failed_GetType nvarchar(256)
	set @localized_string_InsertWorkflowInstanceEvent_Failed_GetType = N'InsertWorkflowInstanceEvent failed calling procedure GetTypeId'

	declare @localized_string_InsertWorkflowInstanceEvent_Failed_InvalidType nvarchar(256)
	set @localized_string_InsertWorkflowInstanceEvent_Failed_InvalidType = N'@EventArgTypeFullName and @EventArgAssemblyFullName must be non null if @EventArg is non null'

		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			smallint
			,@rowcount		int

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END


	/*
		If we have an arg look up or insert the type
	*/
	DECLARE @EventArgTypeId smallint
	IF @EventArg1 IS NOT NULL
	 BEGIN
		/*
			Must have a valid type & assembly name
		*/
		IF @EventArgTypeFullName1 IS NULL OR LEN( LTRIM( RTRIM( @EventArgTypeFullName1 ) ) ) = 0 OR @EventArgAssemblyFullName1 IS NULL OR LEN( LTRIM( RTRIM( @EventArgAssemblyFullName1 ) ) ) = 0
		 BEGIN
			SELECT @error_desc = @localized_string_InsertWorkflowInstanceEvent_Failed_InvalidType
			GOTO FAILED
		 END
		EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @EventArgTypeFullName1
										,@AssemblyFullName	= @EventArgAssemblyFullName1
										,@TypeId			= @EventArgTypeId OUTPUT
		
		IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @EventArgTypeId IS NULL
		 BEGIN
			SELECT @error_desc = @localized_string_InsertWorkflowInstanceEvent_Failed_GetType
			GOTO FAILED
		 END
	 END


	INSERT [dbo].[WorkflowInstanceEvent] (
			[WorkflowInstanceInternalId]
			,[TrackingWorkflowEventId]
			,[EventDateTime]
			,[EventOrder]
			,[EventArgTypeId]
			,[EventArg]
	) VALUES (
			@WorkflowInstanceInternalId
			,@TrackingWorkflowEventId1
			,@EventDateTime1
			,@EventOrder1
			,@EventArgTypeId
			,@EventArg1
	)

	SELECT @error = @@ERROR, @rowcount = @@ROWCOUNT, @WorkflowInstanceEventId1 = SCOPE_IDENTITY()

	IF @error IS NULL OR @error <> 0 OR @rowcount IS NULL OR @rowcount <> 1
	 BEGIN
		SET @error_desc = @localized_string_InsertWorkflowInstanceEvent_Failed_WorkflowInstanceEventInsert
		GOTO FAILED
	 END

	IF @TrackingWorkflowEventId2 IS NOT NULL
	 BEGIN
			SET @EventArgTypeId = NULL

			IF @EventArg2 IS NOT NULL
			 BEGIN
				/*
					Must have a valid type & assembly name
				*/
				IF @EventArgTypeFullName2 IS NULL OR LEN( LTRIM( RTRIM( @EventArgTypeFullName2 ) ) ) = 0 OR @EventArgAssemblyFullName2 IS NULL OR LEN( LTRIM( RTRIM( @EventArgAssemblyFullName2 ) ) ) = 0
				 BEGIN
					SELECT @error_desc = @localized_string_InsertWorkflowInstanceEvent_Failed_InvalidType
					GOTO FAILED
				 END
				EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @EventArgTypeFullName2
												,@AssemblyFullName	= @EventArgAssemblyFullName2
												,@TypeId			= @EventArgTypeId OUTPUT
				
				IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @EventArgTypeId IS NULL
				 BEGIN
					SELECT @error_desc = @localized_string_InsertWorkflowInstanceEvent_Failed_GetType
					GOTO FAILED
				 END
			 END


			INSERT [dbo].[WorkflowInstanceEvent] (
					[WorkflowInstanceInternalId]
					,[TrackingWorkflowEventId]
					,[EventDateTime]
					,[EventOrder]
					,[EventArgTypeId]
					,[EventArg]
			) VALUES (
					@WorkflowInstanceInternalId
					,@TrackingWorkflowEventId2
					,@EventDateTime2
					,@EventOrder2
					,@EventArgTypeId
					,@EventArg2
			)

			SELECT @error = @@ERROR, @rowcount = @@ROWCOUNT, @WorkflowInstanceEventId2 = SCOPE_IDENTITY()

			IF @error IS NULL OR @error <> 0 OR @rowcount IS NULL OR @rowcount <> 1
			 BEGIN
				SET @error_desc = @localized_string_InsertWorkflowInstanceEvent_Failed_WorkflowInstanceEventInsert
				GOTO FAILED
			 END
	 END


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
	return @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertWorkflowInstanceEvent] TO [tracking_writer]
    AS [dbo];


GO

