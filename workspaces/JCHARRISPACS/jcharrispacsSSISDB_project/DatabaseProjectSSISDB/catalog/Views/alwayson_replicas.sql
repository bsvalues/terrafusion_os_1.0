
CREATE VIEW [catalog].[alwayson_replicas] 
AS
SELECT		[server_name],
			[state]
FROM		[internal].[alwayson_support_state]

GO

GRANT SELECT
    ON OBJECT::[catalog].[alwayson_replicas] TO PUBLIC
    AS [dbo];


GO

