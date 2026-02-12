
CREATE VIEW [dbo].[vw_AddedActivity]
AS
SELECT		[WorkflowInstanceInternalId]
			,[WorkflowInstanceEventId]
			,[QualifiedName]
			,[ActivityTypeId]
			,[ParentQualifiedName]
			,[AddedActivityAction]
			,[Order]
FROM		[dbo].[AddedActivity]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_AddedActivity] TO [tracking_reader]
    AS [dbo];


GO

