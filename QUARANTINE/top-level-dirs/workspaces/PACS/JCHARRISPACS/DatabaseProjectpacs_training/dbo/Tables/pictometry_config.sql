CREATE TABLE [dbo].[pictometry_config] (
    [pacs_user_id] INT           NOT NULL,
    [data]         VARCHAR (MAX) NOT NULL,
    CONSTRAINT [CPK_pictometry_config] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC)
);


GO

