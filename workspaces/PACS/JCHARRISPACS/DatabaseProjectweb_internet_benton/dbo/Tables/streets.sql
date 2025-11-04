CREATE TABLE [dbo].[streets] (
    [street_name]   VARCHAR (50)   NOT NULL,
    [street_prefix] VARCHAR (10)   NULL,
    [street_sufix]  VARCHAR (10)   NULL,
    [date_added]    DATETIME       NULL,
    [street_id]     INT            NOT NULL,
    [comment]       VARCHAR (1000) NULL,
    CONSTRAINT [CPK_streets] PRIMARY KEY CLUSTERED ([street_id] ASC) WITH (FILLFACTOR = 90)
);


GO

