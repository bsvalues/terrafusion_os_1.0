CREATE TABLE [dbo].[wa_payout_statement] (
    [run_id]                INT              NOT NULL,
    [statement_id]          INT              NOT NULL,
    [prop_id]               INT              NOT NULL,
    [owner_id]              INT              NOT NULL,
    [owner_name]            VARCHAR (70)     NULL,
    [owner_addr_line1]      VARCHAR (60)     NULL,
    [owner_addr_line2]      VARCHAR (60)     NULL,
    [owner_addr_line3]      VARCHAR (60)     NULL,
    [owner_addr_city]       VARCHAR (50)     NULL,
    [owner_addr_state]      VARCHAR (50)     NULL,
    [owner_addr_zip]        VARCHAR (10)     NULL,
    [owner_addr_country]    VARCHAR (6)      NULL,
    [geo_id]                VARCHAR (60)     NULL,
    [legal_desc]            VARCHAR (255)    NULL,
    [situs_display]         VARCHAR (141)    NULL,
    [detail]                VARCHAR (255)    NULL,
    [term_length]           NUMERIC (5, 2)   NULL,
    [term_type]             VARCHAR (10)     NULL,
    [bond_interest_rate]    NUMERIC (13, 10) NULL,
    [remaining_length]      NUMERIC (5, 2)   NULL,
    [next_payment_due]      DATETIME         NULL,
    [base_amount_due]       NUMERIC (14, 2)  NULL,
    [bond_interest_balance] NUMERIC (14, 2)  NULL,
    [delinquent_interest]   NUMERIC (14, 2)  NULL,
    [penalty]               NUMERIC (14, 2)  NULL,
    [total_payoff_amount]   NUMERIC (14, 2)  NULL,
    [payout_agreement_id]   INT              NOT NULL,
    [scanline]              VARCHAR (42)     NULL,
    [next_payoff_amount]    NUMERIC (14, 2)  NULL,
    [collection_fee]        NUMERIC (14, 2)  NULL,
    [barcode]               VARCHAR (30)     NULL,
    CONSTRAINT [CPK_wa_payout_statement] PRIMARY KEY CLUSTERED ([run_id] ASC, [statement_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_payout_statement_payout_agreement_id] FOREIGN KEY ([payout_agreement_id]) REFERENCES [dbo].[payout_agreement] ([payout_agreement_id]),
    CONSTRAINT [CFK_wa_payout_statement_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[wa_payout_run] ([run_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Separate collection fee amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_payout_statement', @level2type = N'COLUMN', @level2name = N'collection_fee';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Barcode', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_payout_statement', @level2type = N'COLUMN', @level2name = N'barcode';


GO

