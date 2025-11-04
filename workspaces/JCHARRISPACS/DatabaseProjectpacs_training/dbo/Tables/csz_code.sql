CREATE TABLE [dbo].[csz_code] (
    [city_zip_cd]   VARCHAR (12) NOT NULL,
    [city_name]     VARCHAR (50) NULL,
    [city_state]    VARCHAR (2)  NULL,
    [city_zip_code] VARCHAR (15) NULL,
    CONSTRAINT [CPK_csz_code] PRIMARY KEY CLUSTERED ([city_zip_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

