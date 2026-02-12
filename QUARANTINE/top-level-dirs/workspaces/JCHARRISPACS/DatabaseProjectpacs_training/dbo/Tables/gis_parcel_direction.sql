CREATE TABLE [dbo].[gis_parcel_direction] (
    [rec_id]    INT IDENTITY (1, 1) NOT NULL,
    [prop_id]   INT NOT NULL,
    [direction] INT NOT NULL,
    [score]     INT NOT NULL,
    CONSTRAINT [CPK_gis_parcel_direction] PRIMARY KEY CLUSTERED ([rec_id] ASC) WITH (FILLFACTOR = 100)
);


GO

