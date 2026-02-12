CREATE TABLE [dbo].[mm_property_land_misc_code] (
    [mm_id]            INT             NOT NULL,
    [seq_num]          INT             NOT NULL,
    [prop_id]          INT             NOT NULL,
    [prop_val_yr]      NUMERIC (4)     NOT NULL,
    [sup_num]          INT             NOT NULL,
    [misc_id]          INT             NOT NULL,
    [county_indicator] NUMERIC (1)     NOT NULL,
    [cycle]            NUMERIC (1)     NOT NULL,
    [region_cd]        VARCHAR (5)     NULL,
    [hood_cd]          VARCHAR (10)    NULL,
    [subset_cd]        VARCHAR (5)     NULL,
    [misc_code]        VARCHAR (6)     NOT NULL,
    [value]            NUMERIC (14, 3) NOT NULL,
    [index]            NUMERIC (8, 2)  NOT NULL,
    [indexed_value]    NUMERIC (14)    NOT NULL,
    CONSTRAINT [CPK_mm_property_land_misc_code] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC, [prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC, [misc_id] ASC)
);


GO

