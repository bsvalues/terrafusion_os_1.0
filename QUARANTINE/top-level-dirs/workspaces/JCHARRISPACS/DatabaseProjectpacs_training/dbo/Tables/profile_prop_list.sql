CREATE TABLE [dbo].[profile_prop_list] (
    [run_id]             INT             NOT NULL,
    [detail_id]          INT             NOT NULL,
    [prop_id]            INT             NOT NULL,
    [sup_num]            INT             NOT NULL,
    [prop_val_yr]        NUMERIC (4)     NOT NULL,
    [market]             NUMERIC (14)    NULL,
    [imprv_hstd_val]     NUMERIC (14)    NULL,
    [imprv_non_hstd_val] NUMERIC (14)    NULL,
    [land_hstd_val]      NUMERIC (14)    NULL,
    [land_non_hstd_val]  NUMERIC (14)    NULL,
    [ag_market]          NUMERIC (14)    NULL,
    [timber_market]      NUMERIC (14)    NULL,
    [living_area]        NUMERIC (14)    NULL,
    [land_sqft]          NUMERIC (18, 2) NULL,
    [land_acres]         NUMERIC (18, 4) NULL,
    [class_cd]           VARCHAR (50)    NULL,
    [land_front_feet]    NUMERIC (18, 2) NULL,
    [land_depth]         NUMERIC (18, 2) NULL,
    [land_total_sqft]    NUMERIC (18, 2) NULL,
    [land_appr_method]   VARCHAR (50)    NULL,
    [land_num_lots]      NUMERIC (9, 2)  NULL,
    [as_cd]              VARCHAR (10)    NULL,
    [as_imprv_pct]       NUMERIC (5, 2)  NULL,
    [as_land_pct]        NUMERIC (5, 2)  NULL,
    [nbhd_cd]            VARCHAR (50)    NULL,
    [nbhd_imprv_pct]     NUMERIC (5, 2)  NULL,
    [nbhd_land_pct]      NUMERIC (5, 2)  NULL,
    [yr_blt]             NUMERIC (4)     NULL,
    [eff_yr_blt]         NUMERIC (4)     NULL,
    CONSTRAINT [CPK_profile_prop_list] PRIMARY KEY CLUSTERED ([run_id] ASC, [detail_id] ASC, [prop_id] ASC, [sup_num] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

