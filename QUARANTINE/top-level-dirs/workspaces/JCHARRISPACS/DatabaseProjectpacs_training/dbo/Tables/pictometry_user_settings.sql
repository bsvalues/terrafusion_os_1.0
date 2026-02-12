CREATE TABLE [dbo].[pictometry_user_settings] (
    [pacs_user_id] INT           NOT NULL,
    [name]         VARCHAR (65)  NOT NULL,
    [value]        VARCHAR (255) NULL,
    CONSTRAINT [CPK_pictometry_user_settings] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [name] ASC) WITH (FILLFACTOR = 100)
);


GO

