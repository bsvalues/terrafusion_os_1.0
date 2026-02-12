

CREATE VIEW [dbo].[vw_TrackingDataItemAnnotation]
AS
SELECT		[TrackingDataItemId]
			,[WorkflowInstanceInternalId]
			,[Annotation]
FROM		[dbo].[TrackingDataItemAnnotation]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_TrackingDataItemAnnotation] TO [tracking_reader]
    AS [dbo];


GO

