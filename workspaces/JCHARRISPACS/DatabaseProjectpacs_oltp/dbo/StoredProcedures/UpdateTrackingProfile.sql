
CREATE PROCEDURE [dbo].[UpdateTrackingProfile]	@TypeFullName			nvarchar(128)
												,@AssemblyFullName		nvarchar(256)
												,@Version				varchar(32)
												,@TrackingProfileXml	ntext
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_UpdateTrackingProfile_Failed_GetType nvarchar(256)
	set @localized_string_UpdateTrackingProfile_Failed_GetType = N'GetTypeId failed'

	declare @localized_string_UpdateTrackingProfile_Failed_BadVersion nvarchar(256)
	set @localized_string_UpdateTrackingProfile_Failed_BadVersion = N'A version already exists that is greater than or equal to the new version'

	declare @localized_string_UpdateTrackingProfile_Failed_ProfileInsert nvarchar(256)
	set @localized_string_UpdateTrackingProfile_Failed_ProfileInsert = N'Failed inserting into TrackingProfile'


	
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
		SELECT @error_desc = @localized_string_UpdateTrackingProfile_Failed_GetType
		GOTO FAILED
	 END
	/*
			Check that this version doesn't already exist and is higher than all other versions for this type
	*/
	IF EXISTS ( SELECT 1 FROM [dbo].[TrackingProfile] WHERE [WorkflowTypeId] = @TypeId AND [Version] >= @Version )
	 BEGIN
		SELECT @error_desc = @localized_string_UpdateTrackingProfile_Failed_BadVersion
		GOTO FAILED
	 END

	INSERT		[dbo].[TrackingProfile] (
					[Version]
					,[WorkflowTypeId]
					,[TrackingProfileXml]
	)
	VALUES( 
					@Version
					,@TypeId
					,@TrackingProfileXml
	)

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_UpdateTrackingProfile_Failed_ProfileInsert
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
    ON OBJECT::[dbo].[UpdateTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

