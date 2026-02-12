CREATE TABLE [dbo].[_clientdb_sales] (
    [chg_of_owner_id]        INT              NOT NULL,
    [prop_id]                INT              NOT NULL,
    [prop_type_cd]           CHAR (5)         NOT NULL,
    [property_type]          VARCHAR (2)      NULL,
    [state_cd]               VARCHAR (10)     NULL,
    [school_id]              INT              NULL,
    [city_id]                INT              NULL,
    [imprv_class]            VARCHAR (10)     NULL,
    [actual_yr_built]        NUMERIC (4)      NULL,
    [living_area_sqft]       NUMERIC (14)     NULL,
    [land_type_cd]           VARCHAR (10)     NULL,
    [sale_dt]                DATETIME         NULL,
    [sl_price]               NUMERIC (14)     NULL,
    [sl_adj_price]           NUMERIC (14)     NULL,
    [sl_type_cd]             CHAR (5)         NULL,
    [land_only_sale]         BIT              NULL,
    [include_no_calc]        VARCHAR (1)      NOT NULL,
    [sl_ratio_cd]            CHAR (5)         NULL,
    [eff_yr_built]           NUMERIC (4)      NULL,
    [include_reason]         VARCHAR (30)     NOT NULL,
    [geo_id]                 VARCHAR (50)     NULL,
    [simple_geo_id]          VARCHAR (50)     NULL,
    [sl_adj_reason]          VARCHAR (50)     NULL,
    [true_sl_price]          NUMERIC (14)     NULL,
    [local_dor_code]         VARCHAR (10)     NULL,
    [living_area_sqft2]      NUMERIC (33, 17) NULL,
    [living_area]            NUMERIC (14)     NOT NULL,
    [imprv_sub_class]        VARCHAR (10)     NULL,
    [condition_cd]           CHAR (5)         NULL,
    [heat_ac_code]           VARCHAR (75)     NULL,
    [land_total_sqft]        NUMERIC (18, 2)  NOT NULL,
    [land_total_acres]       NUMERIC (18, 4)  NOT NULL,
    [additive_val]           NUMERIC (14)     NOT NULL,
    [percent_complete]       NUMERIC (5, 2)   NOT NULL,
    [sub_market_cd]          VARCHAR (10)     NULL,
    [imprv_type_cd]          CHAR (5)         NULL,
    [imprv_det_meth_cd]      CHAR (5)         NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)     NULL,
    [state_dor_code]         VARCHAR (10)     NULL,
    [tax_area_number]        VARCHAR (23)     NOT NULL,
    [tax_area_id]            INT              NOT NULL,
    [zoning]                 VARCHAR (20)     NULL,
    [mh_make]                VARCHAR (100)    NULL,
    [mh_model]               VARCHAR (100)    NULL,
    [mh_serial]              VARCHAR (100)    NULL,
    [mh_hud]                 VARCHAR (100)    NULL,
    [mh_title]               VARCHAR (100)    NULL,
    [multi_prop_sale]        BIT              NULL,
    [market]                 NUMERIC (14)     NULL,
    [excise_number]          INT              NULL,
    [deed_type_cd]           CHAR (10)        NULL,
    [deed_num]               VARCHAR (50)     NULL,
    [deed_book_id]           CHAR (20)        NULL,
    [deed_book_page]         CHAR (20)        NULL,
    [deed_dt]                DATETIME         NULL,
    [grantor_cv]             VARCHAR (30)     NULL,
    [grantee_cv]             VARCHAR (30)     NULL,
    [seller]                 VARCHAR (1000)   NULL,
    [buyer]                  VARCHAR (1000)   NULL,
    [current_owner]          VARCHAR (1000)   NULL,
    [prop_type_desc]         VARCHAR (50)     NULL,
    [situs_display]          VARCHAR (255)    NULL,
    [legal_desc]             VARCHAR (255)    NULL,
    [owner_name]             VARCHAR (70)     NULL,
    [tax_area]               VARCHAR (300)    NULL,
    [prop_val_yr]            NUMERIC (4)      NOT NULL,
    [show_values]            VARCHAR (1)      NULL,
    [abs_subdv_cd]           VARCHAR (50)     NULL
);


GO

CREATE NONCLUSTERED INDEX [idx__clientdb_sales_chg_of_owner_id]
    ON [dbo].[_clientdb_sales]([chg_of_owner_id] ASC);


GO

CREATE CLUSTERED INDEX [IX__clientdb_sales_multi_prop_sale]
    ON [dbo].[_clientdb_sales]([prop_id] ASC, [multi_prop_sale] ASC);


GO

CREATE NONCLUSTERED INDEX [idx__clientdb_sales_sale_dt]
    ON [dbo].[_clientdb_sales]([sale_dt] ASC);


GO

