CREATE TABLE [dbo].[condominium_amenity] (
    [abs_subdv_cd]      VARCHAR (10) NOT NULL,
    [abs_subdv_yr]      NUMERIC (4)  NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    [value_cd]          VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_condominium_amenity] PRIMARY KEY CLUSTERED ([abs_subdv_cd] ASC, [abs_subdv_yr] ASC, [characteristic_cd] ASC, [value_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_condominium_amenity_abs_subdv_cd_abs_subdv_yr] FOREIGN KEY ([abs_subdv_cd], [abs_subdv_yr]) REFERENCES [dbo].[condominium] ([abs_subdv_cd], [abs_subdv_yr]),
    CONSTRAINT [CFK_condominium_amenity_characteristic_cd] FOREIGN KEY ([characteristic_cd]) REFERENCES [dbo].[condo_characteristic_code] ([characteristic_cd]),
    CONSTRAINT [CFK_condominium_amenity_value_cd] FOREIGN KEY ([characteristic_cd], [value_cd]) REFERENCES [dbo].[condo_attribute_code] ([characteristic_cd], [attribute_cd])
);


GO

