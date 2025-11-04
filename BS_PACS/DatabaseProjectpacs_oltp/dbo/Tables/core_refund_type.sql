CREATE TABLE [dbo].[core_refund_type] (
    [id]          INT          NOT NULL,
    [description] VARCHAR (50) NULL,
    CONSTRAINT [CPK_core_refund_type] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

