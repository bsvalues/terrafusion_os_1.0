CREATE TABLE [dbo].[ProductInfoHistory] (
    [DateTime]     DATETIME      DEFAULT (getdate()) NULL,
    [DbSchemaHash] VARCHAR (128) NOT NULL,
    [Sku]          VARCHAR (25)  NOT NULL,
    [BuildNumber]  VARCHAR (25)  NOT NULL,
    CONSTRAINT [IX_ProductInfoHistory_DateTime] UNIQUE NONCLUSTERED ([DateTime] ASC)
);


GO

GRANT DELETE
    ON OBJECT::[dbo].[ProductInfoHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[ProductInfoHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ProductInfoHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ProductInfoHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ProductInfoHistory] TO [RSExecRole]
    AS [dbo];


GO

