
CREATE VIEW [dbo].[vw_ActivityExecutionStatusEvent]
AS
SELECT		[ActivityExecutionStatusEventId]
			,[WorkflowInstanceInternalId]
			,[EventOrder]				
			,[ActivityInstanceId]		
			,[ExecutionStatusId]					
			,[EventDateTime]					
			,[DbEventDateTime]
FROM		[dbo].[ActivityExecutionStatusEvent]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_ActivityExecutionStatusEvent] TO [tracking_reader]
    AS [dbo];


GO

