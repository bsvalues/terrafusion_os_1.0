
CREATE VIEW [dbo].[vw_WorkflowInstanceEvent]
AS
SELECT		[WorkflowInstanceEventId]	
			,[WorkflowInstanceInternalId]
			,[TrackingWorkflowEventId]
			,[EventDateTime]	
			,[EventOrder]		
			,[EventArgTypeId]		
			,[EventArg]					
			,[DbEventDateTime]	
FROM		[dbo].[WorkflowInstanceEvent]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_WorkflowInstanceEvent] TO [tracking_reader]
    AS [dbo];


GO

