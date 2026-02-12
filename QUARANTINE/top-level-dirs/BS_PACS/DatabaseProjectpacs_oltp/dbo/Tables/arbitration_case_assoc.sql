CREATE TABLE [dbo].[arbitration_case_assoc] (
    [arbitration_id]           INT          NOT NULL,
    [prop_val_yr]              NUMERIC (4)  NOT NULL,
    [case_id]                  INT          NOT NULL,
    [prop_id]                  INT          NOT NULL,
    [begin_land_hstd_val]      NUMERIC (14) NULL,
    [begin_land_non_hstd_val]  NUMERIC (14) NULL,
    [begin_imprv_hstd_val]     NUMERIC (14) NULL,
    [begin_imprv_non_hstd_val] NUMERIC (14) NULL,
    [begin_ag_use_val]         NUMERIC (14) NULL,
    [begin_ag_market]          NUMERIC (14) NULL,
    [begin_timber_use]         NUMERIC (14) NULL,
    [begin_timber_market]      NUMERIC (14) NULL,
    [begin_market]             NUMERIC (14) NULL,
    [begin_appraised_val]      NUMERIC (14) NULL,
    [begin_ten_percent_cap]    NUMERIC (14) NULL,
    [begin_assessed_val]       NUMERIC (14) NULL,
    [begin_rendered_val]       NUMERIC (14) NULL,
    [begin_exemptions]         VARCHAR (50) NULL,
    [begin_entities]           VARCHAR (50) NULL,
    [begin_recalc_dt]          DATETIME     NULL,
    [final_land_hstd_val]      NUMERIC (14) NULL,
    [final_land_non_hstd_val]  NUMERIC (14) NULL,
    [final_imprv_hstd_val]     NUMERIC (14) NULL,
    [final_imprv_non_hstd_val] NUMERIC (14) NULL,
    [final_ag_use_val]         NUMERIC (14) NULL,
    [final_ag_market]          NUMERIC (14) NULL,
    [final_timber_use]         NUMERIC (14) NULL,
    [final_timber_market]      NUMERIC (14) NULL,
    [final_market]             NUMERIC (14) NULL,
    [final_appraised_val]      NUMERIC (14) NULL,
    [final_ten_percent_cap]    NUMERIC (14) NULL,
    [final_assessed_val]       NUMERIC (14) NULL,
    [final_rendered_val]       NUMERIC (14) NULL,
    [final_exemptions]         VARCHAR (50) NULL,
    [final_entities]           VARCHAR (50) NULL,
    [final_recalc_dt]          DATETIME     NULL,
    CONSTRAINT [CPK_arbitration_case_assoc] PRIMARY KEY CLUSTERED ([arbitration_id] ASC, [prop_val_yr] ASC, [case_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_arbitration_case_assoc_arbitration_id_prop_val_yr] FOREIGN KEY ([arbitration_id], [prop_val_yr]) REFERENCES [dbo].[arbitration] ([arbitration_id], [prop_val_yr]),
    CONSTRAINT [CFK_arbitration_case_assoc_prop_id_prop_val_yr_case_id] FOREIGN KEY ([prop_id], [prop_val_yr], [case_id]) REFERENCES [dbo].[_arb_protest] ([prop_id], [prop_val_yr], [case_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[arbitration_case_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

