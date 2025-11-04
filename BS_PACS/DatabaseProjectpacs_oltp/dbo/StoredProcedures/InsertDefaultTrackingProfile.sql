
CREATE PROCEDURE [dbo].[InsertDefaultTrackingProfile]	@TypeFullName			nvarchar(128)	-- Type of the Workflow's companion type
														,@AssemblyFullName		nvarchar(256)	-- Assembly of the Workflow's companion type
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_InsertDefaultTrackingProfile_Failed_GetType nvarchar(256)
	set @localized_string_InsertDefaultTrackingProfile_Failed_GetType = N'GetTypeId failed'

	declare @localized_string_InsertDefaultTrackingProfile_InsertFailed nvarchar(256)
	set @localized_string_InsertDefaultTrackingProfile_InsertFailed = N'Failed inserting into TrackingProfile'


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
	EXEC @ret = [GetTypeId]	@TypeFullName		= @TypeFullName
								,@AssemblyFullName	= @AssemblyFullName
								,@TypeId			= @TypeId OUTPUT
	
	IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TypeId IS NULL
	 BEGIN
		SELECT @error_desc = @localized_string_InsertDefaultTrackingProfile_Failed_GetType
		GOTO FAILED
	 END

	/*
		NULL is inserted so that we don't hold multiple copies of the same profile and needlessly chew up disk space
		Basically this record is just a pointer to the version of the default profile to use

		pk has ignore duplicate key to ignore to handle client races on this insert without holding locks
	*/
	INSERT		[dbo].[TrackingProfile] (
					[Version]
					,[WorkflowTypeId]
					,[TrackingProfileXml]
	)
	SELECT TOP 1	[Version]
					,@TypeId
					,null
	FROM			[dbo].[DefaultTrackingProfile]
	ORDER BY		[InsertDateTime] desc

	IF @@ERROR NOT IN ( 3604 /* ignore dup key */, 0 )
	 BEGIN
		SELECT @error_desc = @localized_string_InsertDefaultTrackingProfile_InsertFailed
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
    ON OBJECT::[dbo].[InsertDefaultTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

