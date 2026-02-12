CREATE TABLE [dbo].[export_appraisal_tax_area_totals] (
    [tax_area_id]              INT          NOT NULL,
    [tax_area_number]          VARCHAR (23) NULL,
    [land_hstd_val]            NUMERIC (14) NULL,
    [land_non_hstd_val]        NUMERIC (14) NULL,
    [imprv_hstd_val]           NUMERIC (14) NULL,
    [imprv_non_hstd_val]       NUMERIC (14) NULL,
    [ag_use_val]               NUMERIC (14) NULL,
    [ag_hs_use_val]            NUMERIC (14) NULL,
    [timber_use_val]           NUMERIC (14) NULL,
    [timber_hs_use_val]        NUMERIC (14) NULL,
    [ag_market]                NUMERIC (14) NULL,
    [timber_market]            NUMERIC (14) NULL,
    [state_assessed]           NUMERIC (14) NULL,
    [appraised]                NUMERIC (14) NULL,
    [appraised_classified]     NUMERIC (14) NULL,
    [appraised_non_classified] NUMERIC (14) NULL,
    [taxable_classified]       NUMERIC (14) NULL,
    [taxable_non_classified]   NUMERIC (14) NULL,
    [mineral_val]              NUMERIC (14) NULL,
    [personal_val]             NUMERIC (14) NULL,
    [auto_val]                 NUMERIC (14) NULL,
    [real_mobile_val]          NUMERIC (14) NULL,
    [num_real_mobile]          INT          NULL,
    [num_personal]             INT          NULL,
    [num_mineral]              INT          NULL,
    [num_auto]                 INT          NULL,
    [num_records]              INT          NULL,
    [market]                   NUMERIC (14) NULL,
    [snr_count_level_1]        INT          NULL,
    [snr_level_1_loss]         NUMERIC (14) NULL,
    [snr_count_level_2]        INT          NULL,
    [snr_level_2_loss]         NUMERIC (14) NULL,
    [snr_count_level_3]        INT          NULL,
    [snr_level_3_loss]         NUMERIC (14) NULL,
    [u500_count]               INT          NULL,
    [u500_amt]                 NUMERIC (14) NULL,
    [hof_count]                INT          NULL,
    [hof_amt]                  NUMERIC (14) NULL,
    [ex_count]                 INT          NULL,
    [ex_amt]                   NUMERIC (14) NULL,
    [year]                     NUMERIC (4)  NOT NULL,
    [sup_num]                  INT          NOT NULL,
    [dataset_id]               INT          NOT NULL,
    CONSTRAINT [cpk_export_appraisal_tax_area_totals] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [tax_area_id] ASC, [year] ASC, [sup_num] ASC)
);


GO

CREATE NONCLUSTERED INDEX [ndx_export_appraisal_tax_area_totals]
    ON [dbo].[export_appraisal_tax_area_totals]([dataset_id] ASC, [year] ASC, [sup_num] ASC, [tax_area_number] ASC);


GO

