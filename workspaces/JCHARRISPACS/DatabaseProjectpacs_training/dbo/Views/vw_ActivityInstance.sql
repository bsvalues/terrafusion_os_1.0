
CREATE VIEW [dbo].[vw_ActivityInstance]
AS
SELECT		[WorkflowInstanceInternalId]
			,[ActivityInstanceId]
			,[QualifiedName]
			,[ContextGuid]
			,[ParentContextGuid]
			,[WorkflowInstanceEventId]
FROM		[dbo].[ActivityInstance]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_ActivityInstance] TO [tracking_reader]
    AS [dbo];


GO

