CREATE TABLE [dbo].[land_detail_characteristic] (
    [prop_id]           INT          NOT NULL,
    [prop_val_yr]       NUMERIC (4)  NOT NULL,
    [sup_num]           INT          NOT NULL,
    [sale_id]           INT          NOT NULL,
    [land_seg_id]       INT          NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    [determinant_cd]    VARCHAR (20) NOT NULL,
    [override]          BIT          NULL,
    [is_from_property]  BIT          CONSTRAINT [CDF_land_detail_characteristic_is_from_property] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_land_detail_characteristic] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [land_seg_id] ASC, [characteristic_cd] ASC, [determinant_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_land_detail_characteristic_characteristic_cd_determinant_cd] FOREIGN KEY ([characteristic_cd], [determinant_cd]) REFERENCES [dbo].[attribute_value_code] ([characteristic_cd], [attribute_cd])
);


GO

