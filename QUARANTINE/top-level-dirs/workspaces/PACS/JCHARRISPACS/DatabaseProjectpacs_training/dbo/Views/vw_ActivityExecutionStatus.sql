

CREATE VIEW [dbo].[vw_ActivityExecutionStatus]
AS
SELECT		[ExecutionStatusId]
			,[Description]
FROM		[dbo].[ActivityExecutionStatus]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_ActivityExecutionStatus] TO [tracking_reader]
    AS [dbo];


GO

