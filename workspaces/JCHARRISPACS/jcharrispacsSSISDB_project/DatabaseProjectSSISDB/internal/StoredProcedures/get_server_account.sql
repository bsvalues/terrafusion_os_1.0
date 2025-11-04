CREATE PROCEDURE [internal].[get_server_account]
@account_name [internal].[adt_name] NULL OUTPUT
AS EXTERNAL NAME [ISSERVER].[Microsoft.SqlServer.IntegrationServices.Server.ServerApi].[GetServerAccount]


GO

GRANT EXECUTE
    ON OBJECT::[internal].[get_server_account] TO PUBLIC
    AS [dbo];


GO

