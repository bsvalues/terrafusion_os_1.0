CREATE TABLE [dbo].[_clientdb_city] (
    [city] VARCHAR (30) NULL
);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_city]
    ON [dbo].[_clientdb_city]([city] ASC);


GO

