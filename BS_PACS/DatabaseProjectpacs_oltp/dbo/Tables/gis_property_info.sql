CREATE TABLE [dbo].[gis_property_info] (
    [prop_id]                 INT             NOT NULL,
    [sup_num]                 INT             NULL,
    [prop_val_yr]             NUMERIC (4)     NOT NULL,
    [geo_id]                  VARCHAR (50)    NULL,
    [map_id]                  VARCHAR (20)    NULL,
    [ref_id1]                 VARCHAR (50)    NULL,
    [ref_id2]                 VARCHAR (50)    NULL,
    [legal_acreage]           NUMERIC (14, 2) NULL,
    [hood_cd]                 VARCHAR (10)    NULL,
    [region]                  VARCHAR (5)     NULL,
    [subset]                  VARCHAR (5)     NULL,
    [dba]                     VARCHAR (50)    NULL,
    [lot_tract]               VARCHAR (50)    NULL,
    [main_area]               NUMERIC (14)    NULL,
    [ag_timber]               NUMERIC (14)    NULL,
    [market]                  NUMERIC (14)    NULL,
    [zoning]                  VARCHAR (50)    NULL,
    [state_cd]                VARCHAR (10)    NULL,
    [class_cd]                VARCHAR (10)    NULL,
    [yr_blt]                  NUMERIC (4)     NULL,
    [eff_yr_blt]              NUMERIC (4)     NULL,
    [land_type_cd]            VARCHAR (10)    NULL,
    [abs_subdv_cd]            VARCHAR (10)    NULL,
    [block]                   VARCHAR (50)    NULL,
    [land_sqft]               NUMERIC (18, 2) NULL,
    [land_acres]              NUMERIC (18, 4) NULL,
    [land_up]                 NUMERIC (14, 2) NULL,
    [land_appr_meth]          VARCHAR (5)     NULL,
    [str_sale_dt]             VARCHAR (100)   NULL,
    [sale_price]              NUMERIC (14)    NULL,
    [sale_type]               VARCHAR (10)    NULL,
    [market_sqft]             NUMERIC (14, 2) NULL,
    [sale_price_sqft]         NUMERIC (14, 2) NULL,
    [sale_ratio]              NUMERIC (18, 5) NULL,
    [file_as_name]            VARCHAR (70)    NULL,
    [address]                 VARCHAR (250)   NULL,
    [situs]                   VARCHAR (150)   NULL,
    [exemptions]              VARCHAR (50)    NULL,
    [situs_num]               VARCHAR (10)    NULL,
    [situs_street]            VARCHAR (50)    NULL,
    [link_message]            VARCHAR (100)   NULL,
    [gis_sq_foot]             NUMERIC (18, 2) NULL,
    [gis_acres]               NUMERIC (18, 4) NULL,
    [owner_id]                INT             NULL,
    [land_adj_econ]           VARCHAR (15)    NULL,
    [land_adj_func]           VARCHAR (15)    NULL,
    [land_adj_area]           VARCHAR (15)    NULL,
    [land_adj_bldr]           VARCHAR (15)    NULL,
    [land_adj_flood]          VARCHAR (15)    NULL,
    [land_adj_land]           VARCHAR (15)    NULL,
    [land_adj_paved_road]     VARCHAR (15)    NULL,
    [land_adj_highway]        VARCHAR (15)    NULL,
    [land_adj_avg_fence]      VARCHAR (15)    NULL,
    [land_adj_good_fence]     VARCHAR (15)    NULL,
    [total_land_market_value] NUMERIC (18)    NULL,
    [improvement_detail_type] VARCHAR (10)    NULL,
    [improvement_adj_bldr]    VARCHAR (20)    NULL,
    [improvement_adj_imp]     VARCHAR (20)    NULL,
    [improvement_adj_adj]     VARCHAR (20)    NULL,
    [improvement_adj_good]    VARCHAR (20)    NULL,
    [improvement_id]          VARCHAR (100)   NULL,
    [income_class]            VARCHAR (10)    NULL,
    [income_nra]              NUMERIC (14)    NULL,
    [income_occupancy]        NUMERIC (5, 2)  NULL,
    [income_vacancy]          NUMERIC (5, 2)  NULL,
    [income_gpi]              NUMERIC (14)    NULL,
    [income_egi]              NUMERIC (14)    NULL,
    [income_exp]              NUMERIC (14)    NULL,
    [income_noi]              NUMERIC (14)    NULL,
    [income_cap_rate]         NUMERIC (5, 2)  NULL,
    [eff_size_acres]          NUMERIC (14, 4) NULL,
    [ls_table]                VARCHAR (25)    NULL,
    [land_segment_1]          VARCHAR (100)   NULL,
    [land_segment_2]          VARCHAR (100)   NULL,
    [land_segment_3]          VARCHAR (100)   NULL,
    [land_segment_4]          VARCHAR (100)   NULL,
    [land_segment_5]          VARCHAR (100)   NULL,
    [land_segment_count]      INT             NULL,
    [improvement_1]           VARCHAR (100)   NULL,
    [improvement_2]           VARCHAR (100)   NULL,
    [improvement_3]           VARCHAR (100)   NULL,
    [improvement_4]           VARCHAR (100)   NULL,
    [improvement_5]           VARCHAR (100)   NULL,
    [improvement_count]       INT             NULL,
    [bpp_count]               INT             NULL,
    [subclass_cd]             VARCHAR (10)    NULL,
    [class_subclass_cd]       VARCHAR (21)    NULL,
    [land_mkt_sqft]           NUMERIC (14, 2) NULL,
    [land_mkt_acre]           NUMERIC (14, 2) NULL,
    [tax_area_number]         VARCHAR (MAX)   NULL,
    [land_adj_codes]          VARCHAR (MAX)   NULL,
    [improvement_adj_codes]   VARCHAR (MAX)   NULL,
    [eff_acres_group_ids]     VARCHAR (MAX)   NULL,
    [eff_acres_group_desc]    VARCHAR (MAX)   NULL,
    [roll_acres_diff]         NUMERIC (14, 2) NULL,
    [roll_acres_diff_pct]     NUMERIC (14, 2) NULL,
    [property_note]           VARCHAR (320)   NULL,
    [update_dt]               DATETIME        CONSTRAINT [CDF_gis_property_info_update_dt] DEFAULT (getdate()) NOT NULL,
    [pool]                    VARCHAR (10)    NULL,
    CONSTRAINT [PK_gis_property_info] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC)
);


GO

CREATE NONCLUSTERED INDEX [qgs__idx]
    ON [dbo].[gis_property_info]([prop_id] ASC);


GO


CREATE TRIGGER tr_gis_property_info_update_dt
   ON  gis_property_info
   AFTER UPDATE
   not for replication
AS 
BEGIN
	SET NOCOUNT ON;

	if not ( UPDATE(update_dt) )
	begin
		update gpi
		set update_dt = getdate()
		from gis_property_info as gpi
		inner join Inserted on
		Inserted.prop_id = gpi.prop_id
		and Inserted.prop_val_yr = gpi.prop_val_yr
	end

END

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether this property has a pool or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'gis_property_info', @level2type = N'COLUMN', @level2name = N'pool';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The datetime of last update for this gis property info record.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'gis_property_info', @level2type = N'COLUMN', @level2name = N'update_dt';


GO

