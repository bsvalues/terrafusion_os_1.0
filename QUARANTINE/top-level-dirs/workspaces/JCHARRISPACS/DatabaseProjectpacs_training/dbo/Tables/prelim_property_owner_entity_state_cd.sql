CREATE TABLE [dbo].[prelim_property_owner_entity_state_cd] (
    [prop_id]                 INT              NOT NULL,
    [year]                    INT              NOT NULL,
    [sup_num]                 INT              NOT NULL,
    [owner_id]                INT              NOT NULL,
    [entity_id]               INT              NOT NULL,
    [state_cd]                CHAR (5)         NOT NULL,
    [acres]                   NUMERIC (18, 4)  NULL,
    [front_foot]              NUMERIC (18, 2)  NULL,
    [ag_acres]                NUMERIC (18, 4)  NULL,
    [ag_use_val]              NUMERIC (14)     NULL,
    [ag_market]               NUMERIC (14)     NULL,
    [market]                  NUMERIC (14)     NULL,
    [imprv_hstd_val]          NUMERIC (14)     NULL,
    [imprv_non_hstd_val]      NUMERIC (14)     NULL,
    [land_hstd_val]           NUMERIC (14)     NULL,
    [land_non_hstd_val]       NUMERIC (14)     NULL,
    [timber_use]              NUMERIC (14)     NULL,
    [timber_market]           NUMERIC (14)     NULL,
    [appraised_val]           NUMERIC (14)     NULL,
    [ten_percent_cap]         NUMERIC (14)     NULL,
    [assessed_val]            NUMERIC (14)     NULL,
    [taxable_val]             NUMERIC (14)     NULL,
    [homestead_val]           NUMERIC (14)     NULL,
    [pct_ownership]           NUMERIC (13, 10) NULL,
    [entity_pct]              NUMERIC (13, 10) NULL,
    [state_cd_pct]            NUMERIC (13, 10) NULL,
    [temp_type]               VARCHAR (2)      NULL,
    [new_val]                 NUMERIC (14)     NULL,
    [arb_status]              VARCHAR (1)      NULL,
    [hs_pct]                  NUMERIC (13, 10) NULL,
    [tax_increment_imprv_val] NUMERIC (14)     NULL,
    [tax_increment_land_val]  NUMERIC (14)     NULL,
    CONSTRAINT [CPK_prelim_property_owner_entity_state_cd] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [entity_id] ASC, [prop_id] ASC, [owner_id] ASC, [state_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[prelim_property_owner_entity_state_cd]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

