CREATE TABLE [dbo].[_clientdb_street_name] (
    [street] VARCHAR (72) NULL
);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_street_name]
    ON [dbo].[_clientdb_street_name]([street] ASC);


GO

