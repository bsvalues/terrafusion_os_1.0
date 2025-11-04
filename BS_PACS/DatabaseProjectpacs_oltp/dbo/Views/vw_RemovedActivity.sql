
CREATE VIEW [dbo].[vw_RemovedActivity]
AS
SELECT		[WorkflowInstanceInternalId]
			,[WorkflowInstanceEventId]
			,[QualifiedName]
			,[ParentQualifiedName]
			,[RemovedActivityAction]
			,[Order]
FROM		[dbo].[RemovedActivity]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_RemovedActivity] TO [tracking_reader]
    AS [dbo];


GO

