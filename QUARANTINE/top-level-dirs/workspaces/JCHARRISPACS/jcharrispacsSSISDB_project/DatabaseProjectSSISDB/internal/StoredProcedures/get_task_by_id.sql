CREATE PROCEDURE [internal].[get_task_by_id]
	@TaskId uniqueidentifier

WITH EXECUTE AS 'AllSchemaOwner'
AS
BEGIN
	SET NOCOUNT ON
	
	IF @TaskId IS NULL
	BEGIN
		RAISERROR(27100, 16, 1, N'@TaskId')
		RETURN 1
	END
	SELECT * FROM [internal].[tasks] WHERE [TaskId] = @TaskId
	RETURN 0
END

GO

GRANT EXECUTE
    ON OBJECT::[internal].[get_task_by_id] TO [ssis_admin]
    AS [dbo];


GO

