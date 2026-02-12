CREATE TABLE [dbo].[_clientdb_township_section] (
    [township_section] VARCHAR (50) NULL
);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_township_section]
    ON [dbo].[_clientdb_township_section]([township_section] ASC);


GO

