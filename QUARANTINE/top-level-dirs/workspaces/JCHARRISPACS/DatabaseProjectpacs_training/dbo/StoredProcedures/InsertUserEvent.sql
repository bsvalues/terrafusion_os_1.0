

CREATE PROCEDURE [dbo].[InsertUserEvent]	@WorkflowInstanceInternalId			bigint
											,@EventOrder						int	
											,@ActivityInstanceId				bigint				= NULL OUTPUT /* IN/OUT */
											,@QualifiedName						nvarchar(128)		= NULL
											,@ContextGuid						uniqueidentifier	= NULL
											,@ParentContextGuid					uniqueidentifier	= NULL
											,@EventDateTime						datetime
											,@UserDataKey						nvarchar(512)		= NULL
											,@UserDataTypeFullName				nvarchar(128)		= NULL
											,@UserDataAssemblyFullName			nvarchar(256)		= NULL
											,@UserData_Str						nvarchar(512)		= NULL
											,@UserData_Blob						image				= NULL
											,@UserDataNonSerializable			bit
											,@UserEventId						bigint	OUTPUT
AS
 BEGIN
	SET NOCOUNT ON	

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	declare @localized_string_InsertUserEvent_Failed_InsertUserEvent nvarchar(256)
	set @localized_string_InsertUserEvent_Failed_InsertUserEvent = N'Failed inserting into UserEvent'
	
	declare @localized_string_InsertUserEvent_Failed_GetType nvarchar(256)
	set @localized_string_InsertUserEvent_Failed_GetType = N'InsertUserEvent failed calling procedure GetTypeId'

	declare @localized_string_InsertUserEvent_Failed_InvalidType nvarchar(256)
	set @localized_string_InsertUserEvent_Failed_InvalidType = N'@EventArgTypeFullName and @EventArgAssemblyFullName must be non null if @EventArg is non null'

	declare @localized_string_InsertUserEvent_Failed_ActivityInstanceIdSel nvarchar(256)
	set @localized_string_InsertUserEvent_Failed_ActivityInstanceIdSel = N'Failed calling GetActivityInstanceId'

	declare @localized_string_InsertUserEvent_Failed_NoEventId nvarchar(256)
	set @localized_string_InsertUserEvent_Failed_NoEventId = N'@UserEventId is null or less than 0'

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

	-- This select->insert sequence is OK because workflows are single threaded
	-- a record isn't going to sneak in between the select and insert
	IF @ActivityInstanceId IS NULL
	 BEGIN
		EXEC @ret = [dbo].[GetActivityInstanceId]		@WorkflowInstanceInternalId			= @WorkflowInstanceInternalId 
														,@QualifiedName						= @QualifiedName
														,@ContextGuid						= @ContextGuid
														,@ParentContextGuid					= @ParentContextGuid
														,@ActivityInstanceId				= @ActivityInstanceId OUTPUT
	
		SELECT @error = @@ERROR
		IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0 OR @ActivityInstanceId IS NULL OR @ActivityInstanceId <= 0
		 BEGIN
			SELECT @error_desc = @localized_string_InsertUserEvent_Failed_ActivityInstanceIdSel
			GOTO FAILED
		 END
	 END

	/*
		If we have an arg look up or insert the type
	*/
	DECLARE @UserDataTypeId smallint
	IF @UserData_Blob IS NOT NULL OR @UserDataNonSerializable=1
	 BEGIN
		/*
			Must have a valid type & assembly name
		*/
		IF @UserDataTypeFullName IS NULL OR LEN( LTRIM( RTRIM( @UserDataTypeFullName ) ) ) = 0 OR @UserDataAssemblyFullName IS NULL OR LEN( LTRIM( RTRIM( @UserDataAssemblyFullName ) ) ) = 0
		 BEGIN
			SELECT @error_desc = @localized_string_InsertUserEvent_Failed_InvalidType
			GOTO FAILED
		 END
		EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @UserDataTypeFullName
										,@AssemblyFullName	= @UserDataAssemblyFullName
										,@TypeId			= @UserDataTypeId OUTPUT
		
		IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @UserDataTypeId IS NULL
		 BEGIN
			SELECT @error_desc = @localized_string_InsertUserEvent_Failed_GetType
			GOTO FAILED
		 END
	 END


	INSERT [dbo].[UserEvent] (
			[WorkflowInstanceInternalId]
			,[EventOrder]
			,[ActivityInstanceId]
			,[EventDateTime]
			,[UserDataKey]
			,[UserDataTypeId]
			,[UserData_Str]
			,[UserData_Blob]
			,[UserDataNonSerializable]
	) VALUES (
			@WorkflowInstanceInternalId
			,@EventOrder
			,@ActivityInstanceId
			,@EventDateTime
			,@UserDataKey
			,@UserDataTypeId
			,@UserData_Str
			,@UserData_Blob
			,@UserDataNonSerializable
	)

	SELECT @error = @@ERROR, @rowcount = @@ROWCOUNT, @UserEventId = scope_identity()

	IF @error IS NULL OR @error <> 0 OR @rowcount IS NULL OR @rowcount <> 1
	 BEGIN
		SET @error_desc = @localized_string_InsertUserEvent_Failed_InsertUserEvent
		GOTO FAILED
	 END

	IF @UserEventId IS NULL OR @UserEventId < 0
	 BEGIN
		SET @error_desc = @localized_string_InsertUserEvent_Failed_NoEventId
		GOTO FAILED
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
    ON OBJECT::[dbo].[InsertUserEvent] TO [tracking_writer]
    AS [dbo];


GO

