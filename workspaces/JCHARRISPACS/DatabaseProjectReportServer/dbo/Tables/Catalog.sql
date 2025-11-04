CREATE TABLE [dbo].[Catalog] (
    [ItemID]         UNIQUEIDENTIFIER NOT NULL,
    [Path]           NVARCHAR (425)   NOT NULL,
    [Name]           NVARCHAR (425)   NOT NULL,
    [ParentID]       UNIQUEIDENTIFIER NULL,
    [Type]           INT              NOT NULL,
    [Content]        VARBINARY (MAX)  NULL,
    [Intermediate]   UNIQUEIDENTIFIER NULL,
    [SnapshotDataID] UNIQUEIDENTIFIER NULL,
    [LinkSourceID]   UNIQUEIDENTIFIER NULL,
    [Property]       NTEXT            NULL,
    [Description]    NVARCHAR (512)   NULL,
    [Hidden]         BIT              NULL,
    [CreatedByID]    UNIQUEIDENTIFIER NOT NULL,
    [CreationDate]   DATETIME         NOT NULL,
    [ModifiedByID]   UNIQUEIDENTIFIER NOT NULL,
    [ModifiedDate]   DATETIME         NOT NULL,
    [MimeType]       NVARCHAR (260)   NULL,
    [SnapshotLimit]  INT              NULL,
    [Parameter]      NTEXT            NULL,
    [PolicyID]       UNIQUEIDENTIFIER NOT NULL,
    [PolicyRoot]     BIT              NOT NULL,
    [ExecutionFlag]  INT              NOT NULL,
    [ExecutionTime]  DATETIME         NULL,
    [SubType]        NVARCHAR (128)   NULL,
    [ComponentID]    UNIQUEIDENTIFIER NULL,
    [ContentSize]    BIGINT           NULL,
    CONSTRAINT [PK_Catalog] PRIMARY KEY NONCLUSTERED ([ItemID] ASC),
    CONSTRAINT [FK_Catalog_CreatedByID] FOREIGN KEY ([CreatedByID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [FK_Catalog_LinkSourceID] FOREIGN KEY ([LinkSourceID]) REFERENCES [dbo].[Catalog] ([ItemID]),
    CONSTRAINT [FK_Catalog_ModifiedByID] FOREIGN KEY ([ModifiedByID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [FK_Catalog_ParentID] FOREIGN KEY ([ParentID]) REFERENCES [dbo].[Catalog] ([ItemID]),
    CONSTRAINT [FK_Catalog_Policy] FOREIGN KEY ([PolicyID]) REFERENCES [dbo].[Policies] ([PolicyID])
);


GO
EXECUTE sp_tableoption @TableNamePattern = N'[dbo].[Catalog]', @OptionName = N'text in row', @OptionValue = N'256';


GO

CREATE NONCLUSTERED INDEX [IX_DatasetLookup]
    ON [dbo].[Catalog]([Type] ASC, [ItemID] ASC);


GO

CREATE UNIQUE CLUSTERED INDEX [IX_Catalog]
    ON [dbo].[Catalog]([Path] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Parent]
    ON [dbo].[Catalog]([ParentID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ComponentLookup]
    ON [dbo].[Catalog]([Type] ASC, [ComponentID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Policy]
    ON [dbo].[Catalog]([PolicyID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Link]
    ON [dbo].[Catalog]([LinkSourceID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SnapshotDataId]
    ON [dbo].[Catalog]([SnapshotDataID] ASC);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Catalog] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Catalog] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Catalog] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Catalog] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Catalog] TO [RSExecRole]
    AS [dbo];


GO

