CREATE TABLE [dbo].[pictometry_system_settings] (
    [name]  VARCHAR (65)  NOT NULL,
    [value] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_pictometry_system_settings] PRIMARY KEY CLUSTERED ([name] ASC) WITH (FILLFACTOR = 100)
);


GO

