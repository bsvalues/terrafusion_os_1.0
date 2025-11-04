
CREATE VIEW [dbo].[vw_TrackingProfile]
AS
SELECT		[TrackingProfileId]
			,[Version]
			,[WorkflowTypeId]
			,[TrackingProfileXml]
			,[InsertDateTime]
FROM		[dbo].[TrackingProfile]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_TrackingProfile] TO [tracking_reader]
    AS [dbo];


GO

