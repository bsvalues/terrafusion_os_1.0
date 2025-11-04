CREATE PROCEDURE [dbo].[AddProductInfo]
    @DbSchemaHash varchar(128),
    @Sku varchar(25),
    @BuildNumber varchar(25)
AS
    INSERT INTO [dbo].[ProductInfoHistory]
        ([DbSchemaHash], [Sku], [BuildNumber])
    VALUES
        (@DbSchemaHash, @Sku, @BuildNumber)

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[AddProductInfo] TO [RSExecRole]
    AS [dbo];


GO

