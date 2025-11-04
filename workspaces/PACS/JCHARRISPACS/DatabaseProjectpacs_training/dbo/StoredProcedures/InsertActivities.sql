
CREATE PROCEDURE [dbo].[InsertActivities]			@WorkflowTypeId		int
													,@Activities		ntext
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int
			,@ActivityTypeId	int
			,@hdoc			int
			,@QId			nvarchar(128)
			,@PQId			nvarchar(128)
			,@FullName		nvarchar(128)
			,@Assembly		nvarchar(256)

	declare @localized_string_InsertActivities_Failed_GetType nvarchar(256)
	set @localized_string_InsertActivities_Failed_GetType = N'InsertActivities failed calling procedure GetTypeId'

	declare @localized_string_InsertActivities_Failed_ActivityInsert nvarchar(256)
	set @localized_string_InsertActivities_Failed_ActivityInsert = N'InsertActivities failed inserting into Activity'

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END

	EXEC sp_xml_preparedocument @hdoc OUTPUT, @Activities

	DECLARE activities INSENSITIVE CURSOR FOR
	SELECT 		[TypeFullName]
				,[AssemblyFullName]
				,[QualifiedName]
				,[ParentQualifiedName]
	FROM		OPENXML ( @hdoc, '/Activities/Activity',2) WITH
	            (
						[TypeFullName]			nvarchar(128)
						,[AssemblyFullName]		nvarchar(256)
						,[QualifiedName]			nvarchar(128)
						,[ParentQualifiedName]	nvarchar(128)
				)
	
	OPEN activities
	FETCH NEXT FROM activities INTO @FullName, @Assembly, @QId, @PQId

	WHILE @@FETCH_STATUS = 0
	 BEGIN
		/*
			Look up or insert the type of the Activity
		*/
		EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @FullName
										,@AssemblyFullName	= @Assembly
										,@TypeId			= @ActivityTypeId OUTPUT
		
		IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @ActivityTypeId IS NULL
		 BEGIN
			CLOSE activities
			DEALLOCATE activities
			SELECT @error_desc = @localized_string_InsertActivities_Failed_GetType
			GOTO FAILED
		 END
	
		INSERT [dbo].[Activity]	(
			[WorkflowTypeId]
			,[QualifiedName]
			,[ActivityTypeId]
			,[ParentQualifiedName]
		)
		VALUES (
			@WorkflowTypeId
			,@QId
			,@ActivityTypeId
			,@PQId
		)	

		IF @@ERROR <> 0 OR @@ROWCOUNT <> 1
		 BEGIN
			CLOSE activities
			DEALLOCATE activities
			SELECT @error_desc = @localized_string_InsertActivities_Failed_ActivityInsert
			GOTO FAILED
		 END
	
		FETCH NEXT FROM activities INTO @FullName, @Assembly, @QId, @PQId	
	 END

	CLOSE activities
	DEALLOCATE activities

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
	IF @hdoc IS NOT NULL
		EXEC sp_xml_removedocument @hdoc
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertActivities] TO [tracking_writer]
    AS [dbo];


GO

