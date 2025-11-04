CREATE TABLE [dbo].[property_val_state_cd] (
    [prop_id]            INT             NOT NULL,
    [sup_num]            INT             NOT NULL,
    [prop_val_yr]        NUMERIC (4)     NOT NULL,
    [state_cd]           CHAR (5)        NOT NULL,
    [imprv_hstd_val]     NUMERIC (14)    NULL,
    [imprv_non_hstd_val] NUMERIC (14)    NULL,
    [land_hstd_val]      NUMERIC (14)    NULL,
    [land_non_hstd_val]  NUMERIC (14)    NULL,
    [ag_use_val]         NUMERIC (14)    NULL,
    [ag_market]          NUMERIC (14)    NULL,
    [timber_use]         NUMERIC (14)    NULL,
    [timber_market]      NUMERIC (14)    NULL,
    [mineral_val]        NUMERIC (14)    NULL,
    [personal_val]       NUMERIC (14)    NULL,
    [appraised_val]      NUMERIC (14)    NULL,
    [ten_percent_cap]    NUMERIC (14)    NULL,
    [assessed_val]       NUMERIC (14)    NULL,
    [market_val]         NUMERIC (14)    NULL,
    [state_cd_pct]       NUMERIC (9, 8)  NULL,
    [imp_new_val]        NUMERIC (14)    NULL,
    [acres]              NUMERIC (18, 4) NULL,
    [pp_new_val]         NUMERIC (14)    NULL,
    [land_new_val]       NUMERIC (14)    NULL,
    [ag_acres]           NUMERIC (18, 4) NULL,
    [effective_front]    NUMERIC (18, 2) NULL,
    CONSTRAINT [CPK_property_val_state_cd] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC, [state_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[property_val_state_cd]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

