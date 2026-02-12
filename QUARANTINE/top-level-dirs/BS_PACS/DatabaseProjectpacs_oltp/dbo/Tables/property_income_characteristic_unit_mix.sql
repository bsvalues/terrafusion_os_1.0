CREATE TABLE [dbo].[property_income_characteristic_unit_mix] (
    [year]                   NUMERIC (4)    NOT NULL,
    [sup_num]                INT            NOT NULL,
    [prop_id]                INT            NOT NULL,
    [pic_id]                 INT            NOT NULL,
    [unit_mix_id]            INT            NOT NULL,
    [num_units]              INT            NOT NULL,
    [unit_type]              VARCHAR (10)   NOT NULL,
    [baths]                  VARCHAR (5)    NULL,
    [style]                  VARCHAR (20)   NULL,
    [size_sqft]              NUMERIC (6, 2) NULL,
    [rent_per_unit]          NUMERIC (6)    NULL,
    [num_spaces]             NUMERIC (3)    NULL,
    [rent_per_space]         NUMERIC (6)    NULL,
    [gross_monthly_rent]     NUMERIC (8)    NULL,
    [special_program_unit]   BIT            NOT NULL,
    [water_sewer]            BIT            NOT NULL,
    [garbage]                BIT            NOT NULL,
    [electricity]            BIT            NOT NULL,
    [heat]                   BIT            NOT NULL,
    [cable]                  BIT            NOT NULL,
    [carport_garage_in_rent] BIT            NOT NULL,
    [other]                  VARCHAR (50)   NULL,
    CONSTRAINT [CPK_property_income_characteristic_unit_mix] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [pic_id] ASC, [unit_mix_id] ASC),
    CONSTRAINT [CFK_property_income_characteristic_unit_mix_baths] FOREIGN KEY ([baths]) REFERENCES [dbo].[income_characteristic_baths_code] ([baths_cd]),
    CONSTRAINT [CFK_property_income_characteristic_unit_mix_style] FOREIGN KEY ([style]) REFERENCES [dbo].[income_characteristic_style_code] ([style_cd]),
    CONSTRAINT [CFK_property_income_characteristic_unit_mix_unit_type] FOREIGN KEY ([unit_type]) REFERENCES [dbo].[income_unit_type_code] ([unit_type_cd]),
    CONSTRAINT [CFK_property_income_characteristic_unit_mix_year_sup_num_prop_id_pic_id] FOREIGN KEY ([year], [sup_num], [prop_id], [pic_id]) REFERENCES [dbo].[property_income_characteristic] ([year], [sup_num], [prop_id], [pic_id])
);


GO

