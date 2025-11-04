
CREATE PROCEDURE [catalog].[update_logdb_info]
		@server_name		nvarchar(max),
		@connection_string 	nvarchar(max)
WITH EXECUTE AS 'AllSchemaOwner'
AS
    SET NOCOUNT ON
	EXEC [internal].[update_logdb_info]
	    @server_name,
		@connection_string

GO

GRANT EXECUTE
    ON OBJECT::[catalog].[update_logdb_info] TO [ssis_admin]
    AS [dbo];


GO

