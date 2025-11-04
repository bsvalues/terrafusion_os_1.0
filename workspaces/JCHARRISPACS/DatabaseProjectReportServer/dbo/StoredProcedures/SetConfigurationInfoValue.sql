CREATE PROCEDURE [dbo].[SetConfigurationInfoValue]
@ConfigValue nvarchar (260),
@ConfigName nvarchar (260)
AS

UPDATE [dbo].[ConfigurationInfo]
SET [Value] = @ConfigValue
WHERE [Name] = @ConfigName

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetConfigurationInfoValue] TO [RSExecRole]
    AS [dbo];


GO

