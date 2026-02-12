CREATE TABLE [dbo].[_clientdb_values_detail] (
    [prop_id]                  INT          NOT NULL,
    [prop_val_yr]              NUMERIC (4)  NOT NULL,
    [imprv_hstd_val]           NUMERIC (14) NULL,
    [imprv_non_hstd_val]       NUMERIC (14) NULL,
    [land_hstd_val]            NUMERIC (14) NULL,
    [land_non_hstd_val]        NUMERIC (14) NULL,
    [ag_use_val]               NUMERIC (14) NULL,
    [timber_use]               NUMERIC (14) NULL,
    [ag_market]                NUMERIC (14) NULL,
    [timber_market]            NUMERIC (14) NULL,
    [market]                   NUMERIC (14) NULL,
    [appraised_val]            NUMERIC (14) NULL,
    [ten_percent_cap]          NUMERIC (14) NULL,
    [assessed_val]             NUMERIC (14) NULL,
    [current_hs_use_val]       NUMERIC (14) NULL,
    [current_nhs_use_val]      NUMERIC (14) NULL,
    [current_hs_mkt_val]       NUMERIC (14) NULL,
    [current_nhs_mkt_val]      NUMERIC (14) NULL,
    [productivity_loss]        NUMERIC (14) NULL,
    [exmpt_value]              NUMERIC (14) NULL,
    [snr_exempt_loss]          NUMERIC (14) NULL,
    [appraised_classified]     NUMERIC (14) NULL,
    [appraised_non_classified] NUMERIC (14) NULL,
    [non_taxed_mkt_val]        NUMERIC (14) NULL,
    [show_values]              VARCHAR (1)  NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_values_detail]
    ON [dbo].[_clientdb_values_detail]([prop_val_yr] ASC, [prop_id] ASC);


GO

