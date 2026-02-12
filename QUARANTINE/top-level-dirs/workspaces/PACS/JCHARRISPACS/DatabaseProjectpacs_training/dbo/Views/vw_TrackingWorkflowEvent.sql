
CREATE VIEW [dbo].[vw_TrackingWorkflowEvent]
AS
SELECT		[TrackingWorkflowEventId]
			,[Description]
FROM		[dbo].[TrackingWorkflowEvent]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_TrackingWorkflowEvent] TO [tracking_reader]
    AS [dbo];


GO

