CREATE TABLE [dbo].[ModelPerspective] (
    [ID]                     UNIQUEIDENTIFIER NOT NULL,
    [ModelID]                UNIQUEIDENTIFIER NOT NULL,
    [PerspectiveID]          NTEXT            NOT NULL,
    [PerspectiveName]        NTEXT            NULL,
    [PerspectiveDescription] NTEXT            NULL,
    CONSTRAINT [FK_ModelPerspectiveModel] FOREIGN KEY ([ModelID]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE
);


GO
EXECUTE sp_tableoption @TableNamePattern = N'[dbo].[ModelPerspective]', @OptionName = N'text in row', @OptionValue = N'256';


GO

CREATE CLUSTERED INDEX [IX_ModelPerspective]
    ON [dbo].[ModelPerspective]([ModelID] ASC);


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ModelPerspective] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ModelPerspective] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[ModelPerspective] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ModelPerspective] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[ModelPerspective] TO [RSExecRole]
    AS [dbo];


GO

