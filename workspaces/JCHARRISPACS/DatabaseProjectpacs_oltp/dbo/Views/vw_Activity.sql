
CREATE VIEW [dbo].[vw_Activity]
AS
SELECT		[WorkflowTypeId]
			,[QualifiedName]
			,[ActivityTypeId]
			,[ParentQualifiedName]
FROM 		[dbo].[Activity]

GO

