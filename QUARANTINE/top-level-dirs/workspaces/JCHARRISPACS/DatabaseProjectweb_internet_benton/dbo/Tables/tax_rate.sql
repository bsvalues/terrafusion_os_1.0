CREATE TABLE [dbo].[tax_rate] (
    [entity_id]               INT              NOT NULL,
    [tax_rate_yr]             NUMERIC (4)      NOT NULL,
    [discount_dt]             DATETIME         NULL,
    [late_dt]                 DATETIME         NULL,
    [attorney_fee_dt]         DATETIME         NULL,
    [bills_created_dt]        DATETIME         NULL,
    [m_n_o_tax_pct]           NUMERIC (13, 10) NULL,
    [i_n_s_tax_pct]           NUMERIC (13, 10) NULL,
    [prot_i_n_s_tax_pct]      NUMERIC (13, 10) NULL,
    [sales_tax_pct]           NUMERIC (13, 10) NULL,
    [levy_start_rct_num]      NUMERIC (18)     NULL,
    [supp_start_rct_num]      NUMERIC (18)     NULL,
    [stmnt_dt]                DATETIME         NULL,
    [collect_for]             CHAR (1)         NULL,
    [appraise_for]            CHAR (1)         NULL,
    [ready_to_certify]        CHAR (1)         NULL,
    [special_inv_entity]      CHAR (1)         NULL,
    [ready_to_create_bill]    CHAR (1)         NULL,
    [PLUS_1_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_1_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_2_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_2_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_3_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_3_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_4_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_4_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_5_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_5_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_6_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_6_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_7_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_7_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_8_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_8_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [PLUS_9_INT_PCT]          NUMERIC (13, 10) NULL,
    [PLUS_9_PENALTY_PCT]      NUMERIC (13, 10) NULL,
    [attorney_fee_pct]        NUMERIC (4, 2)   NULL,
    [effective_due_dt]        DATETIME         NULL,
    [collect_option]          CHAR (5)         NULL,
    [weed_control]            CHAR (1)         NULL,
    [weed_control_pct]        NUMERIC (4, 2)   NULL,
    [ptd_option]              CHAR (1)         NULL,
    [apply_bpp_attorney_fees] BIT              CONSTRAINT [DF__clientdb_tax_rate__apply___74F30FE8] DEFAULT ((0)) NOT NULL,
    [bpp_attorney_fee_dt]     DATETIME         NULL,
    CONSTRAINT [CPK_tax_rate] PRIMARY KEY CLUSTERED ([entity_id] ASC, [tax_rate_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_tax_rate_yr]
    ON [dbo].[tax_rate]([tax_rate_yr] ASC) WITH (FILLFACTOR = 90);


GO

