
CREATE PROCEDURE [dbo].[DeleteTrackingProfile]	@TypeFullName			nvarchar(128)	-- Type of the Workflow's companion type
												,@AssemblyFullName		nvarchar(256)	-- Assembly of the Workflow's companion type
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_DeleteTrackingProfile_Failed_GetType nvarchar(256)
	set @localized_string_DeleteTrackingProfile_Failed_GetType = N'GetTypeId failed'

	declare @localized_string_DeleteTrackingProfile_Failed_ProfileInsert nvarchar(256)
	set @localized_string_DeleteTrackingProfile_Failed_ProfileInsert = N'Failed inserting delete record into TrackingProfile'



	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			smallint
	

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END


	DECLARE @TypeId int
	/*
		Look up or insert the type of the Workflow
	*/
	EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @TypeFullName
								,@AssemblyFullName	= @AssemblyFullName
								,@TypeId			= @TypeId OUTPUT
	
	IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TypeId IS NULL
	 BEGIN
		SELECT @error_desc = @localized_string_DeleteTrackingProfile_Failed_GetType
		GOTO FAILED
	 END

	INSERT [dbo].[TrackingProfile] (
			[Version]
			,[WorkflowTypeId]
			,[TrackingProfileXml]
	) VALUES (
			-1
			,@TypeId
			,NULL
	)

	IF @@ERROR <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_DeleteTrackingProfile_Failed_ProfileInsert
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
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

