
CREATE VIEW [dbo].[vw_TrackingProfileInstance]
AS
SELECT		[InstanceId]
			,[TrackingProfileXml]
			,[UpdatedDateTime]
FROM		[dbo].[TrackingProfileInstance]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_TrackingProfileInstance] TO [tracking_reader]
    AS [dbo];


GO

