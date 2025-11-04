CREATE TABLE [dbo].[nbhd_cost_calc_capture_props] (
    [profile_run_list_detail_id] INT             NOT NULL,
    [run_id]                     INT             NULL,
    [chg_of_owner_id]            INT             NOT NULL,
    [prop_id]                    INT             NULL,
    [is_outlier]                 BIT             CONSTRAINT [CDF_nbhd_cost_calc_capture_props_is_outlier] DEFAULT (0) NULL,
    [sale_date]                  DATETIME        NULL,
    [sale_price]                 NUMERIC (14)    NULL,
    [living_area]                INT             NULL,
    [land_total_val]             NUMERIC (14)    NULL,
    [imprv_val]                  NUMERIC (14)    NULL,
    [sale_cont_imprv_val]        NUMERIC (14)    NULL,
    [ind_nbhd_adj]               NUMERIC (14, 2) NULL,
    [sale_psf]                   NUMERIC (14, 2) NULL,
    [land_to_sale_ratio]         NUMERIC (14, 4) NULL,
    [appr_to_sale_ratio]         NUMERIC (14, 4) NULL,
    [rev_imprv_val]              NUMERIC (14)    NULL,
    [rev_appr_val]               NUMERIC (14)    NULL,
    [rev_appr_psf]               NUMERIC (14, 2) NULL,
    [rev_appr_to_sale_ratio]     NUMERIC (14, 4) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_chg_of_owner_id]
    ON [dbo].[nbhd_cost_calc_capture_props]([chg_of_owner_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_profile_run_list_detail_id]
    ON [dbo].[nbhd_cost_calc_capture_props]([profile_run_list_detail_id] ASC) WITH (FILLFACTOR = 90);


GO

