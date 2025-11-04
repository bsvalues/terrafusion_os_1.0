CREATE TABLE [dbo].[Batch] (
    [BatchID]    UNIQUEIDENTIFIER NOT NULL,
    [AddedOn]    DATETIME         NOT NULL,
    [Action]     VARCHAR (32)     NOT NULL,
    [Item]       NVARCHAR (425)   NULL,
    [Parent]     NVARCHAR (425)   NULL,
    [Param]      NVARCHAR (425)   NULL,
    [BoolParam]  BIT              NULL,
    [Content]    IMAGE            NULL,
    [Properties] NTEXT            NULL
);


GO

CREATE CLUSTERED INDEX [IX_Batch]
    ON [dbo].[Batch]([BatchID] ASC, [AddedOn] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Batch_1]
    ON [dbo].[Batch]([AddedOn] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[Batch] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Batch] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Batch] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Batch] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Batch] TO [RSExecRole]
    AS [dbo];


GO

