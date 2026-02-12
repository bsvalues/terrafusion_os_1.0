CREATE PROCEDURE [dbo].[GetOneConfigurationInfo]
@Name nvarchar (260)
AS
SELECT [Value]
FROM [ConfigurationInfo]
WHERE [Name] = @Name

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetOneConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

