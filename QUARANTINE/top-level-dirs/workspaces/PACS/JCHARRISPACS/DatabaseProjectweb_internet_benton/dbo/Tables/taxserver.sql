CREATE TABLE [dbo].[taxserver] (
    [taxserver_id] INT      NOT NULL,
    [taxserver_cd] CHAR (5) NULL,
    CONSTRAINT [CPK_taxserver] PRIMARY KEY CLUSTERED ([taxserver_id] ASC) WITH (FILLFACTOR = 90)
);


GO

