
CREATE PROCEDURE [dbo].[GetActivityInstanceId]		@WorkflowInstanceInternalId			bigint
													,@QualifiedName						nvarchar(128)	
													,@ContextGuid						uniqueidentifier
													,@ParentContextGuid					uniqueidentifier
													,@ActivityInstanceId				bigint				OUTPUT
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	declare @localized_string_GetActivityInstanceId_Failed_ActivityInstanceSel nvarchar(256)
	set @localized_string_GetActivityInstanceId_Failed_ActivityInstanceSel = N'Failed selecting from ActivityInstance'

	declare @localized_string_GetActivityInstanceId_Failed_ActivityInstanceInsert nvarchar(256)
	set @localized_string_GetActivityInstanceId_Failed_ActivityInstanceInsert = N'Failed inserting into ActivityInstance'

	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			smallint
			,@id			bigint


	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END


	SELECT			@ActivityInstanceId					= [ai].[ActivityInstanceId]
	FROM			[dbo].[ActivityInstance] [ai] WITH (INDEX([idx_ActivityInstance_WorkflowInstanceInternalId_QualifiedName_ContextGuid_ParentContextGuid]))
	WHERE			[ai].[WorkflowInstanceInternalId]	= @WorkflowInstanceInternalId
	AND				[ai].[QualifiedName]				= @QualifiedName
	AND				[ai].[ContextGuid]					= @ContextGuid
	AND				[ai].[ParentContextGuid]			= @ParentContextGuid

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0
		return -1

	IF @ActivityInstanceId IS NULL
	 BEGIN
		DECLARE @EventId int
		/*
			If there is a QName for this Activity in the AddedActivity table
			get the WorkflowInstanceEventId and write it to ActivityInstance.
		*/
		SELECT 		@EventId = MAX([WorkflowInstanceEventId])
		FROM		[dbo].[AddedActivity]
		WHERE		[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
		AND			[QualifiedName] = @QualifiedName
		
		INSERT [dbo].[ActivityInstance] (
				[WorkflowInstanceInternalId]
				,[QualifiedName]
				,[ContextGuid]
				,[ParentContextGuid]
				,[WorkflowInstanceEventId]
		) VALUES (
				@WorkflowInstanceInternalId
				,@QualifiedName
				,@ContextGuid
				,@ParentContextGuid
				,@EventId
		)
		
		SELECT @error = @@ERROR, @ActivityInstanceId = SCOPE_IDENTITY()

		IF @error IS NULL OR @error <> 0 OR @@ROWCOUNT <> 1 OR @ActivityInstanceId IS NULL
		 BEGIN
			SELECT @error_desc = @localized_string_GetActivityInstanceId_Failed_ActivityInstanceInsert
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
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetActivityInstanceId] TO [tracking_writer]
    AS [dbo];


GO

