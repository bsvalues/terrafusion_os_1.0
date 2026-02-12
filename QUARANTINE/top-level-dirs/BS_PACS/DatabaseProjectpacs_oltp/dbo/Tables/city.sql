CREATE TABLE [dbo].[city] (
    [city_cd]   CHAR (5)     NOT NULL,
    [city_name] VARCHAR (50) NULL,
    CONSTRAINT [CPK_city] PRIMARY KEY CLUSTERED ([city_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

