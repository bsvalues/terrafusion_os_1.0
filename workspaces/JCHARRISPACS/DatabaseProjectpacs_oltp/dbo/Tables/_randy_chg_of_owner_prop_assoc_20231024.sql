CREATE TABLE [dbo].[_randy_chg_of_owner_prop_assoc_20231024] (
    [chg_of_owner_id]      INT          NOT NULL,
    [prop_id]              INT          NOT NULL,
    [seq_num]              INT          NOT NULL,
    [sup_tax_yr]           NUMERIC (4)  NOT NULL,
    [imprv_hstd_val]       NUMERIC (14) NULL,
    [imprv_non_hstd_val]   NUMERIC (14) NULL,
    [land_hstd_val]        NUMERIC (14) NULL,
    [land_non_hstd_val]    NUMERIC (14) NULL,
    [ag_use_val]           NUMERIC (14) NULL,
    [ag_market]            NUMERIC (14) NULL,
    [ag_loss]              NUMERIC (14) NULL,
    [timber_use]           NUMERIC (14) NULL,
    [timber_market]        NUMERIC (14) NULL,
    [timber_loss]          NUMERIC (14) NULL,
    [appraised_val]        NUMERIC (14) NULL,
    [assessed_val]         NUMERIC (14) NULL,
    [market]               NUMERIC (14) NULL,
    [bPrimary]             BIT          NULL,
    [continue_current_use] BIT          NULL
);


GO

