CREATE PROCEDURE [dbo].[RemoveConfigurationInfoValue]
@Name nvarchar (260)
AS

DELETE FROM [dbo].[ConfigurationInfo] 
WHERE [Name] = @Name

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RemoveConfigurationInfoValue] TO [RSExecRole]
    AS [dbo];


GO

