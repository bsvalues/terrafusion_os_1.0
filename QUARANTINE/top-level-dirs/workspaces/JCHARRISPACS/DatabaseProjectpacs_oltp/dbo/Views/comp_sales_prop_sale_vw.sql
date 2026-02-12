
create view comp_sales_prop_sale_vw
with schemabinding

as

	select
		coopa.prop_id,
		coopa.chg_of_owner_id,
		dbo.sale.sl_ratio_type_cd,
		dbo.sale.sl_type_cd,
		dbo.sale.sl_state_cd,
		dbo.sale.sl_class_cd,
		dbo.sale.sl_land_type_cd,
		dbo.sale.sl_price,
		dbo.sale.sl_dt,
		dbo.sale.sl_yr_blt,
		dbo.sale.sl_living_area,
		dbo.sale.sl_imprv_unit_price,
		dbo.sale.sl_land_sqft,
		dbo.sale.sl_land_acres,
		dbo.sale.sl_land_front_feet,
		dbo.sale.sl_land_unit_price,
		dbo.sale.sl_school_id,
		dbo.sale.sl_city_id,
		dbo.sale.sl_sub_class_cd,
		dbo.sale.sl_imprv_type_cd,
		dbo.sale.sl_county_ratio_cd,

		dbo.sale.adjusted_sl_price

	from dbo.chg_of_owner_prop_assoc as coopa
	join dbo.sale on
		coopa.chg_of_owner_id = sale.chg_of_owner_id

GO

CREATE NONCLUSTERED INDEX [idx_sl_living_area]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_living_area] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_land_acres]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_land_acres] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_sub_class_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_sub_class_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_price]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_price] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [qgs__idx]
    ON [dbo].[comp_sales_prop_sale_vw]([prop_id] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_sl_imprv_type_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_imprv_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_dt]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_dt] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_ratio_type_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_ratio_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_school_id]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_school_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_class_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_class_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_city_id]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_city_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_land_type_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_land_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_county_ratio_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_county_ratio_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE UNIQUE CLUSTERED INDEX [idx_comp_sales_prop_sale_vw]
    ON [dbo].[comp_sales_prop_sale_vw]([prop_id] ASC, [chg_of_owner_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_imprv_unit_price]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_imprv_unit_price] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_land_front_feet]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_land_front_feet] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_type_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_chg_of_owner_id]
    ON [dbo].[comp_sales_prop_sale_vw]([chg_of_owner_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_land_unit_price]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_land_unit_price] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_state_cd]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_state_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_yr_blt]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_yr_blt] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_land_sqft]
    ON [dbo].[comp_sales_prop_sale_vw]([sl_land_sqft] ASC) WITH (FILLFACTOR = 90);


GO

