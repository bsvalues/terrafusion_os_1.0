
CREATE VIEW [dbo].[vw_Workflow]
AS
SELECT		[WorkflowTypeId]
			,[WorkflowDefinition]
FROM		[dbo].[Workflow]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_Workflow] TO [tracking_reader]
    AS [dbo];


GO

