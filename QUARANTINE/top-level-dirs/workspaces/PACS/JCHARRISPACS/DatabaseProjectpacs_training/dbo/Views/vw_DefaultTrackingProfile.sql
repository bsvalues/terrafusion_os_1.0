
CREATE VIEW [dbo].[vw_DefaultTrackingProfile]
AS
SELECT		[Version]
			,[TrackingProfileXml]
			,[InsertDateTime]
FROM		[dbo].[DefaultTrackingProfile]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_DefaultTrackingProfile] TO [tracking_reader]
    AS [dbo];


GO

