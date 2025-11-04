CREATE TABLE [dbo].[prelim_wash_property_val] (
    [prop_val_yr]               NUMERIC (4)    NOT NULL,
    [sup_num]                   INT            NOT NULL,
    [prop_id]                   INT            NOT NULL,
    [appraised_classified]      NUMERIC (14)   NOT NULL,
    [appraised_non_classified]  NUMERIC (14)   NOT NULL,
    [snr_imprv]                 NUMERIC (14)   NOT NULL,
    [snr_land]                  NUMERIC (14)   NOT NULL,
    [snr_new_val]               NUMERIC (14)   NOT NULL,
    [snr_qualify_yr]            NUMERIC (14)   NOT NULL,
    [snr_qualify_yr_override]   BIT            NOT NULL,
    [snr_frz_imprv_hs]          NUMERIC (14)   NOT NULL,
    [snr_frz_land_hs]           NUMERIC (14)   NOT NULL,
    [snr_frz_imprv_hs_override] BIT            NOT NULL,
    [snr_frz_land_hs_override]  BIT            NOT NULL,
    [snr_taxable_portion]       NUMERIC (14)   NOT NULL,
    [snr_exempt_loss]           NUMERIC (14)   NOT NULL,
    [snr_portion_applied]       NUMERIC (14)   NOT NULL,
    [snr_new_val_override]      BIT            NULL,
    [comment_update_date]       DATETIME       NULL,
    [comment_update_user]       VARCHAR (35)   NULL,
    [snr_comment]               VARCHAR (5000) NULL,
    [tsRowVersion]              ROWVERSION     NOT NULL,
    [state_assessed]            NUMERIC (14)   NULL,
    [snr_imprv_lesser]          NUMERIC (14)   NULL,
    [snr_land_lesser]           NUMERIC (14)   NULL,
    CONSTRAINT [CPK_prelim_wash_property_val] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC)
);


GO

