CREATE PROCEDURE [dbo].[SetConfigurationInfo]
@Name nvarchar (260),
@Value ntext
AS
DELETE
FROM [ConfigurationInfo]
WHERE [Name] = @Name

IF @Value is not null BEGIN
   INSERT
   INTO ConfigurationInfo
   VALUES ( newid(), @Name, @Value )
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

