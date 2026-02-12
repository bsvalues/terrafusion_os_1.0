CREATE PROCEDURE [dbo].[DeleteDataModelRoleByID]
    @DataModelRoleID bigint  
AS
BEGIN
    DELETE FROM 
        [dbo].[DataModelRole]
    WHERE 
        [DataModelRoleID] = @DataModelRoleID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteDataModelRoleByID] TO [RSExecRole]
    AS [dbo];


GO

