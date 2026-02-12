CREATE PROCEDURE [dbo].[GetDataModelRolesByItemID]
    @ItemID uniqueidentifier
AS
    SELECT
        [DataModelRoleID],
        [ItemID],
        [ModelRoleID],
        [ModelRoleName]
    FROM
        [dbo].[DataModelRole]
    WHERE
        [ItemID] = @ItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetDataModelRolesByItemID] TO [RSExecRole]
    AS [dbo];


GO

