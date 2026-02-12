CREATE TABLE [dbo].[DataModelDataSource] (
    [DSID]                BIGINT           IDENTITY (1, 1) NOT NULL,
    [ItemId]              UNIQUEIDENTIFIER NOT NULL,
    [DSType]              VARCHAR (100)    NULL,
    [DSKind]              VARCHAR (100)    NULL,
    [AuthType]            VARCHAR (100)    NULL,
    [ConnectionString]    VARBINARY (MAX)  NULL,
    [Username]            VARBINARY (MAX)  NULL,
    [Password]            VARBINARY (MAX)  NULL,
    [ModelConnectionName] VARCHAR (260)    NULL,
    [CreatedByID]         UNIQUEIDENTIFIER NULL,
    [CreatedDate]         DATETIME         DEFAULT (getdate()) NOT NULL,
    [ModifiedByID]        UNIQUEIDENTIFIER NULL,
    [ModifiedDate]        DATETIME         DEFAULT (getdate()) NOT NULL,
    [DataSourceID]        UNIQUEIDENTIFIER DEFAULT (newsequentialid()) NOT NULL,
    CONSTRAINT [PK_DataModelDataSource] PRIMARY KEY CLUSTERED ([DSID] ASC),
    CONSTRAINT [FK_DataModelDataSource_Catalog] FOREIGN KEY ([ItemId]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_DataModelDataSource]
    ON [dbo].[DataModelDataSource]([ItemId] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_DataModelDataSource_DataSourceID]
    ON [dbo].[DataModelDataSource]([DataSourceID] ASC);


GO

GRANT SELECT
    ON OBJECT::[dbo].[DataModelDataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[DataModelDataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[DataModelDataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[DataModelDataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[DataModelDataSource] TO [RSExecRole]
    AS [dbo];


GO

