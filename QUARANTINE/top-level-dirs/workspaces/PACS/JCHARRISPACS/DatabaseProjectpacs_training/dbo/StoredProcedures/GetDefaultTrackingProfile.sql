
CREATE PROCEDURE [dbo].[GetDefaultTrackingProfile] @Version varchar(32)
AS
 BEGIN
	SET NOCOUNT ON

	SELECT		[TrackingProfileXml]
	FROM		[DefaultTrackingProfile]
	WHERE		[Version]  = @Version

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetDefaultTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

