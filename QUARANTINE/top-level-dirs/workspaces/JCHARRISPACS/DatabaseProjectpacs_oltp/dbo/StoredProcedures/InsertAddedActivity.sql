
CREATE PROCEDURE [dbo].[InsertAddedActivity]	@WorkflowInstanceInternalId	bigint
												,@WorkflowInstanceEventId	bigint
												,@QualifiedName				nvarchar(128)
												,@TypeFullName				nvarchar(128)
												,@AssemblyFullName			nvarchar(256)
												,@ParentQualifiedName		nvarchar(128) 	= NULL
												,@AddedActivityAction		nvarchar(2000)	= NULL
												,@Order						int				= NULL
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			int
			,@id			int
			,@TypeId		int
			,@rowcount		int
			,@ParentWorkflowActivityId bigint

	declare @localized_string_InsertAddedActivity_Failed_GetType nvarchar(256)
	set @localized_string_InsertAddedActivity_Failed_GetType = N'InsertAddedActivity failed calling procedure GetTypeId'

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END


	/*
		Look up or insert the type of the Activity
	*/
	EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @TypeFullName
									,@AssemblyFullName	= @AssemblyFullName
									,@TypeId			= @TypeId OUTPUT
	
	IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TypeId IS NULL
	 BEGIN
		SELECT @error_desc = @localized_string_InsertAddedActivity_Failed_GetType
		GOTO FAILED
	 END

	INSERT	[dbo].[AddedActivity] (
		[WorkflowInstanceInternalId]
		,[WorkflowInstanceEventId]
		,[QualifiedName]
		,[ActivityTypeId]
		,[ParentQualifiedName]
		,[AddedActivityAction]
		,[Order]
	) VALUES (
		@WorkflowInstanceInternalId
		,@WorkflowInstanceEventId
		,@QualifiedName
		,@TypeId
		,@ParentQualifiedName
		,@AddedActivityAction
		,@Order
	)

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
    ON OBJECT::[dbo].[InsertAddedActivity] TO [tracking_writer]
    AS [dbo];


GO

