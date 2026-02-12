


CREATE VIEW [dbo].[vw_WorkflowInstance]
AS
SELECT		[WorkflowInstanceInternalId]
			,[WorkflowInstanceId]
			,[ContextGuid]
			,[CallerInstanceId]
			,[CallPath]
			,[CallerContextGuid]
			,[CallerParentContextGuid]
			,[WorkflowTypeId]
			,[InitializedDateTime]
			,[DbInitializedDateTime]
			,[EndDateTime]
			,[DbEndDateTime]
FROM		[dbo].[WorkflowInstance]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_WorkflowInstance] TO [tracking_reader]
    AS [dbo];


GO

