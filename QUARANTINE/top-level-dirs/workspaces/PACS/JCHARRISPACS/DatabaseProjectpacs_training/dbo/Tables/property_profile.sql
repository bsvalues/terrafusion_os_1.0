CREATE TABLE [dbo].[property_profile] (
    [prop_id]                                INT             NOT NULL,
    [prop_val_yr]                            NUMERIC (4)     NOT NULL,
    [sup_num]                                INT             NOT NULL,
    [update_dt]                              DATETIME        NULL,
    [school_id]                              INT             NULL,
    [city_id]                                INT             NULL,
    [state_cd]                               VARCHAR (10)    NULL,
    [class_cd]                               VARCHAR (10)    NULL,
    [land_type_cd]                           VARCHAR (10)    NULL,
    [yr_blt]                                 NUMERIC (4)     NULL,
    [living_area]                            NUMERIC (14)    NULL,
    [imprv_unit_price]                       NUMERIC (14, 2) NULL,
    [imprv_add_val]                          NUMERIC (14)    NULL,
    [land_sqft]                              NUMERIC (18, 2) NULL,
    [land_acres]                             NUMERIC (18, 4) NULL,
    [land_front_feet]                        NUMERIC (18, 2) NULL,
    [land_depth]                             NUMERIC (18, 2) NULL,
    [land_lot]                               VARCHAR (1)     NULL,
    [land_unit_price]                        NUMERIC (14, 2) NULL,
    [region]                                 VARCHAR (5)     NULL,
    [abs_subdv]                              VARCHAR (10)    NULL,
    [neighborhood]                           VARCHAR (10)    NULL,
    [subset]                                 VARCHAR (5)     NULL,
    [map_id]                                 VARCHAR (20)    NULL,
    [appraised_val]                          NUMERIC (14)    NULL,
    [land_num_lots]                          NUMERIC (9, 2)  NULL,
    [land_appr_method]                       VARCHAR (5)     NULL,
    [land_total_sqft]                        NUMERIC (18, 2) NULL,
    [eff_yr_blt]                             NUMERIC (4)     NULL,
    [condition_cd]                           CHAR (5)        NULL,
    [percent_complete]                       NUMERIC (5, 2)  NULL,
    [ls_table]                               CHAR (25)       NULL,
    [main_land_unit_price]                   NUMERIC (14, 2) NULL,
    [main_land_total_adj]                    NUMERIC (8, 6)  NULL,
    [size_adj_pct]                           NUMERIC (5, 2)  NULL,
    [heat_ac_code]                           VARCHAR (75)    NULL,
    [land_total_acres]                       NUMERIC (18, 4) NULL,
    [zoning]                                 VARCHAR (50)    NULL,
    [visibility_access_cd]                   VARCHAR (10)    NULL,
    [sub_market_cd]                          VARCHAR (10)    NULL,
    [road_access]                            VARCHAR (50)    NULL,
    [land_useable_acres]                     NUMERIC (18, 4) NULL,
    [land_useable_sqft]                      NUMERIC (18, 2) NULL,
    [property_use_cd]                        VARCHAR (10)    NULL,
    [last_appraisal_dt]                      DATETIME        NULL,
    [utilities]                              VARCHAR (50)    NULL,
    [topography]                             VARCHAR (50)    NULL,
    [num_imprv]                              INT             NULL,
    [imprv_type_cd]                          CHAR (5)        NULL,
    [imprv_det_sub_class_cd]                 VARCHAR (10)    NULL,
    [class_cd_highvalueimprov]               VARCHAR (10)    NULL,
    [imprv_det_sub_class_cd_highvalueimprov] VARCHAR (10)    NULL,
    [living_area_highvalueimprov]            NUMERIC (14)    NULL,
    [actual_year_built]                      NUMERIC (4)     NULL,
    [characteristic_zoning1]                 VARCHAR (20)    NULL,
    [characteristic_zoning2]                 VARCHAR (20)    NULL,
    [characteristic_view]                    VARCHAR (20)    NULL,
    [actual_age]                             INT             NULL,
    [mbl_hm_make]                            VARCHAR (100)   NULL,
    [mbl_hm_model]                           VARCHAR (100)   NULL,
    [mbl_hm_sn]                              VARCHAR (100)   NULL,
    [mbl_hm_hud_num]                         VARCHAR (100)   NULL,
    [mbl_hm_title_num]                       VARCHAR (100)   NULL,
    [imprv_det_meth_cd_highvalueimprov]      CHAR (5)        NULL,
    [imprv_building_name_highvalueimprov]    VARCHAR (50)    NULL,
    [imprv_det_lease_class_highvalueimprov]  VARCHAR (10)    NULL,
    CONSTRAINT [CPK_property_profile] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_neighborhood]
    ON [dbo].[property_profile]([neighborhood] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_living_area]
    ON [dbo].[property_profile]([living_area] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_city_id]
    ON [dbo].[property_profile]([city_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_condition_cd]
    ON [dbo].[property_profile]([condition_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_class_cd_highvalueimprov]
    ON [dbo].[property_profile]([class_cd_highvalueimprov] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_state_cd]
    ON [dbo].[property_profile]([state_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[property_profile]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_sub_class_cd_highvalueimprov]
    ON [dbo].[property_profile]([imprv_det_sub_class_cd_highvalueimprov] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_sub_class_cd]
    ON [dbo].[property_profile]([imprv_det_sub_class_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_yr_blt]
    ON [dbo].[property_profile]([yr_blt] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_living_area_highvalueimprov]
    ON [dbo].[property_profile]([living_area_highvalueimprov] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_type_cd]
    ON [dbo].[property_profile]([imprv_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_abs_subdv]
    ON [dbo].[property_profile]([abs_subdv] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_class_cd]
    ON [dbo].[property_profile]([class_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_school_id]
    ON [dbo].[property_profile]([school_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Highest Impovement Value Lease Class', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_profile', @level2type = N'COLUMN', @level2name = N'imprv_det_lease_class_highvalueimprov';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Highest Impovement Value Building Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_profile', @level2type = N'COLUMN', @level2name = N'imprv_building_name_highvalueimprov';


GO

