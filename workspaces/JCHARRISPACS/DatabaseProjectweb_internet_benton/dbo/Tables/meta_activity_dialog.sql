CREATE TABLE [dbo].[meta_activity_dialog] (
    [dialog_id] INT           IDENTITY (1, 1) NOT NULL,
    [name]      VARCHAR (255) NOT NULL,
    [dialog]    VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_meta_activity_dialog] PRIMARY KEY CLUSTERED ([dialog_id] ASC, [name] ASC) WITH (FILLFACTOR = 100)
);


GO

