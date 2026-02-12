
CREATE PROCEDURE [dbo].[DeleteInstanceTrackingProfile]	@InstanceId			uniqueidentifier
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_DeleteInstanceTrackingProfile_Failed_ProfileUpdate nvarchar(256)
	set @localized_string_DeleteInstanceTrackingProfile_Failed_ProfileUpdate = N'Failed updating TrackingProfileInstance'

	declare @localized_string_DeleteInstanceTrackingProfile_Failed_ProfileInsert nvarchar(256)
	set @localized_string_DeleteInstanceTrackingProfile_Failed_ProfileInsert = N'Failed inserting into TrackingProfileInstance'


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
		Update first, if we get a hit, great, we're done
	*/
	UPDATE	[dbo].[TrackingProfileInstance]
	SET		[TrackingProfileXml] = NULL
			,[UpdatedDateTime]= getutcdate()
	WHERE	[InstanceId] = @InstanceId

	SELECT @error = @@ERROR, @rowcount = @@ROWCOUNT

	IF @error <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_DeleteInstanceTrackingProfile_Failed_ProfileUpdate
		GOTO FAILED
	 END
	/*
		Check if the update hit a row, if not insert
	*/
	IF @rowcount = 0 
	 BEGIN
		INSERT [dbo].[TrackingProfileInstance] (
			[InstanceId]
			,[TrackingProfileXml]
		) VALUES (
			@InstanceId
			,NULL
		)
		
		IF @error <> 0
		 BEGIN
			SELECT @error_desc = @localized_string_DeleteInstanceTrackingProfile_Failed_ProfileInsert
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
    ON OBJECT::[dbo].[DeleteInstanceTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

