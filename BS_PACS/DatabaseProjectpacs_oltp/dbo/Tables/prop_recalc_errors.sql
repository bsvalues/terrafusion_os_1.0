CREATE TABLE [dbo].[prop_recalc_errors] (
    [error_id]               INT           IDENTITY (1, 1) NOT NULL,
    [prop_id]                INT           NOT NULL,
    [sup_num]                INT           NOT NULL,
    [sup_yr]                 NUMERIC (4)   NOT NULL,
    [sale_id]                INT           NULL,
    [imprv_id]               INT           NULL,
    [imprv_desc]             VARCHAR (50)  NULL,
    [imprv_detail_id]        INT           NULL,
    [imprv_detail_desc]      VARCHAR (50)  NULL,
    [land_detail_id]         INT           NULL,
    [land_detail_desc]       VARCHAR (50)  NULL,
    [error]                  VARCHAR (255) NULL,
    [error_type]             VARCHAR (5)   NULL,
    [record_type]            VARCHAR (5)   NULL,
    [ptd_imprv_hstd_val]     NUMERIC (14)  NULL,
    [pv_imprv_hstd_val]      NUMERIC (14)  NULL,
    [ptd_imprv_non_hstd_val] NUMERIC (14)  NULL,
    [pv_imprv_non_hstd_val]  NUMERIC (14)  NULL,
    [ptd_land_hstd_val]      NUMERIC (14)  NULL,
    [pv_land_hstd_val]       NUMERIC (14)  NULL,
    [ptd_land_non_hstd_val]  NUMERIC (14)  NULL,
    [pv_land_non_hstd_val]   NUMERIC (14)  NULL,
    [ptd_ag_use_val]         NUMERIC (14)  NULL,
    [pv_ag_use_val]          NUMERIC (14)  NULL,
    [ptd_ag_market]          NUMERIC (14)  NULL,
    [pv_ag_market]           NUMERIC (14)  NULL,
    [ptd_timber_use]         NUMERIC (14)  NULL,
    [pv_timber_use]          NUMERIC (14)  NULL,
    [ptd_timber_market]      NUMERIC (14)  NULL,
    [pv_timber_market]       NUMERIC (14)  NULL,
    [ptd_appraised_val]      NUMERIC (14)  NULL,
    [pv_appraised_val]       NUMERIC (14)  NULL,
    [ptd_assessed_val]       NUMERIC (14)  NULL,
    [pv_assessed_val]        NUMERIC (14)  NULL,
    [ptd_market_val]         NUMERIC (14)  NULL,
    [pv_market_val]          NUMERIC (14)  NULL,
    [ptd_ten_percent_cap]    NUMERIC (14)  NULL,
    [pv_ten_percent_cap]     NUMERIC (14)  NULL,
    [income_id]              INT           NULL,
    [land_type_cd]           VARCHAR (10)  NULL,
    CONSTRAINT [CPK_prop_recalc_errors] PRIMARY KEY CLUSTERED ([error_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_income_id]
    ON [dbo].[prop_recalc_errors]([income_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sup_yr_sup_num_prop_id]
    ON [dbo].[prop_recalc_errors]([sup_yr] ASC, [sup_num] ASC, [prop_id] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[prop_recalc_errors]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Land Type Code of Land Segment with Error', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prop_recalc_errors', @level2type = N'COLUMN', @level2name = N'land_type_cd';


GO

