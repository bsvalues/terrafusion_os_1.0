CREATE TABLE [dbo].[characteristic_value_code] (
    [characteristic_cd]     VARCHAR (10) NOT NULL,
    [characteristic_desc]   VARCHAR (40) NOT NULL,
    [push_to_land]          BIT          NOT NULL,
    [priority]              INT          NULL,
    [receive_from_gis]      BIT          NULL,
    [available_to_property] BIT          NULL,
    [available_to_land]     BIT          NULL,
    [primary_zoning]        BIT          NULL,
    [topography]            BIT          NULL,
    [secondary_zoning]      BIT          NOT NULL,
    CONSTRAINT [CPK_characteristic_value_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

