-- Republishing generates new DSID and stores those in the object model,
-- in order to resolve the data sources we need to rebind the old
-- data source definition to the current DSID
CREATE PROCEDURE [dbo].[RebindDataSource]
@ItemId		uniqueidentifier,
@Name		nvarchar(260),
@NewDSID	uniqueidentifier
AS
UPDATE DataSource
SET DSID = @NewDSID
WHERE ItemID = @ItemId AND [Name] = @Name

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RebindDataSource] TO [RSExecRole]
    AS [dbo];


GO

