CREATE PROCEDURE [dbo].[GetAllConfigurationInfo]
AS
SELECT [Name], [Value]
FROM [ConfigurationInfo]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetAllConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

