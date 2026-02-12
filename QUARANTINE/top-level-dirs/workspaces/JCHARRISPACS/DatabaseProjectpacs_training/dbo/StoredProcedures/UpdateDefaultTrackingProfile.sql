
CREATE PROCEDURE [dbo].[UpdateDefaultTrackingProfile] @Version varchar(32), @TrackingProfileXml ntext
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	INSERT		[dbo].[DefaultTrackingProfile] (
					[Version]
					,[TrackingProfileXml]
	)
	VALUES ( 
					@Version
					,@TrackingProfileXml
	)

	IF @@ERROR <> 0
		RETURN -1
	ELSE
		RETURN 0
 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateDefaultTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

