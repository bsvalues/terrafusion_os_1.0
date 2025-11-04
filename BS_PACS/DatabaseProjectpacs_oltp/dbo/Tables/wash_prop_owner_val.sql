CREATE TABLE [dbo].[wash_prop_owner_val] (
    [year]                                NUMERIC (4)      NOT NULL,
    [sup_num]                             INT              NOT NULL,
    [prop_id]                             INT              NOT NULL,
    [owner_id]                            INT              NOT NULL,
    [land_hstd_val]                       NUMERIC (14)     NOT NULL,
    [land_non_hstd_val]                   NUMERIC (14)     NOT NULL,
    [imprv_hstd_val]                      NUMERIC (14)     NOT NULL,
    [imprv_non_hstd_val]                  NUMERIC (14)     NOT NULL,
    [ag_use_val]                          NUMERIC (14)     NOT NULL,
    [ag_market]                           NUMERIC (14)     NOT NULL,
    [ag_loss]                             NUMERIC (14)     NOT NULL,
    [ag_hs_use_val]                       NUMERIC (14)     NOT NULL,
    [ag_hs_market]                        NUMERIC (14)     NOT NULL,
    [ag_hs_loss]                          NUMERIC (14)     NOT NULL,
    [timber_use_val]                      NUMERIC (14)     NOT NULL,
    [timber_market]                       NUMERIC (14)     NOT NULL,
    [timber_loss]                         NUMERIC (14)     NOT NULL,
    [timber_hs_use_val]                   NUMERIC (14)     NOT NULL,
    [timber_hs_market]                    NUMERIC (14)     NOT NULL,
    [timber_hs_loss]                      NUMERIC (14)     NOT NULL,
    [new_val_hs]                          NUMERIC (14)     NOT NULL,
    [new_val_nhs]                         NUMERIC (14)     NOT NULL,
    [new_val_p]                           NUMERIC (14)     NOT NULL,
    [appraised]                           NUMERIC (14)     NOT NULL,
    [market]                              NUMERIC (14)     NOT NULL,
    [snr_frz_imprv_hs]                    NUMERIC (14)     NOT NULL,
    [snr_frz_land_hs]                     NUMERIC (14)     NOT NULL,
    [appraised_classified]                NUMERIC (14)     NOT NULL,
    [appraised_non_classified]            NUMERIC (14)     NOT NULL,
    [taxable_classified]                  NUMERIC (14)     NOT NULL,
    [taxable_non_classified]              NUMERIC (14)     NOT NULL,
    [state_assessed]                      NUMERIC (14)     NOT NULL,
    [destroyed_prop]                      BIT              NOT NULL,
    [destroyed_jan1_value]                NUMERIC (14)     NOT NULL,
    [destroyed_prorate_pct]               DECIMAL (20, 19) NULL,
    [prorate_type]                        VARCHAR (5)      NULL,
    [prorate_begin]                       DATETIME         NULL,
    [prorate_end]                         DATETIME         NULL,
    [boe_status]                          BIT              NOT NULL,
    [destroyed_jan1_classified_value]     NUMERIC (14)     CONSTRAINT [CDF_wash_prop_owner_val_destroyed_jan1_classified_value] DEFAULT ((0)) NOT NULL,
    [destroyed_jan1_non_classified_value] NUMERIC (14)     CONSTRAINT [CDF_wash_prop_owner_val_destroyed_jan1_non_classified_value] DEFAULT ((0)) NOT NULL,
    [non_taxed_mkt_val]                   NUMERIC (14)     CONSTRAINT [CDF_wash_prop_owner_val_non_taxed_mkt_val] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_wash_prop_owner_val] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[wash_prop_owner_val]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Destroyed value - classified portion', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_val', @level2type = N'COLUMN', @level2name = N'destroyed_jan1_classified_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Destroyed value - non-classified portion', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_val', @level2type = N'COLUMN', @level2name = N'destroyed_jan1_non_classified_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Market value for non-taxable land segments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_prop_owner_val', @level2type = N'COLUMN', @level2name = N'non_taxed_mkt_val';


GO

