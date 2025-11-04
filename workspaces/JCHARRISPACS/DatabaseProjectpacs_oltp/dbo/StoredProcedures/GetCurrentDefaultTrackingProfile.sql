
CREATE PROCEDURE [dbo].[GetCurrentDefaultTrackingProfile]
AS
 BEGIN
	SET NOCOUNT ON

	SELECT		TOP 1 [Version]
				,[TrackingProfileXml]
	FROM		[dbo].[DefaultTrackingProfile]
	ORDER BY	[InsertDateTime] desc

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetCurrentDefaultTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

