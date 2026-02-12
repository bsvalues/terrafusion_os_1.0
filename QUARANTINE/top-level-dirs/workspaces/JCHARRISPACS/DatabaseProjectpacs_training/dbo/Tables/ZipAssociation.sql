CREATE TABLE [dbo].[ZipAssociation] (
    [street_id]   INT          NOT NULL,
    [city_zip_cd] VARCHAR (12) NOT NULL,
    CONSTRAINT [CPK_ZipAssociation] PRIMARY KEY CLUSTERED ([street_id] ASC, [city_zip_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_ZipAssociation_city_zip_cd] FOREIGN KEY ([city_zip_cd]) REFERENCES [dbo].[csz_code] ([city_zip_cd]),
    CONSTRAINT [CFK_ZipAssociation_street_id] FOREIGN KEY ([street_id]) REFERENCES [dbo].[streets] ([street_id])
);


GO

