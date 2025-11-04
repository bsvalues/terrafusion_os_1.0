CREATE TABLE [dbo].[DataModelRole] (
    [DataModelRoleID] BIGINT           IDENTITY (1, 1) NOT NULL,
    [ItemID]          UNIQUEIDENTIFIER NOT NULL,
    [ModelRoleID]     UNIQUEIDENTIFIER NOT NULL,
    [ModelRoleName]   NVARCHAR (255)   NOT NULL,
    CONSTRAINT [PK_DataModelRole] PRIMARY KEY CLUSTERED ([DataModelRoleID] ASC),
    CONSTRAINT [FK_DataModelRole_Catalog] FOREIGN KEY ([ItemID]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_DataModelRole_ItemID]
    ON [dbo].[DataModelRole]([ItemID] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[DataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[DataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[DataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[DataModelRole] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[DataModelRole] TO [RSExecRole]
    AS [dbo];


GO

