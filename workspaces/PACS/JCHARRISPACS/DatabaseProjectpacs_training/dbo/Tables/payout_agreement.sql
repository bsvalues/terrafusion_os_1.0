CREATE TABLE [dbo].[payout_agreement] (
    [payout_agreement_id]            INT             NOT NULL,
    [create_date]                    DATETIME        NOT NULL,
    [pacs_user_id]                   INT             NOT NULL,
    [start_date]                     DATETIME        NOT NULL,
    [agreement_type_cd]              VARCHAR (10)    NOT NULL,
    [status_cd]                      VARCHAR (10)    NOT NULL,
    [use_bond_interest]              BIT             NOT NULL,
    [preset_periodic_payment]        BIT             NOT NULL,
    [payment_terms_type_cd]          VARCHAR (10)    NOT NULL,
    [number_of_payments]             INT             NOT NULL,
    [amount_due]                     NUMERIC (14, 2) NOT NULL,
    [amount_paid]                    NUMERIC (14, 2) NOT NULL,
    [ref_id]                         VARCHAR (50)    NULL,
    [periodic_payment_amount]        NUMERIC (14, 2) NULL,
    [bond_interest_percentage]       NUMERIC (14, 4) NULL,
    [bond_interest_begin_date]       DATETIME        NULL,
    [bond_interest_end_date]         DATETIME        NULL,
    [bond_interest_frequency]        VARCHAR (10)    NULL,
    [override_penalty_and_interest]  BIT             CONSTRAINT [CDF_payout_agreement_override_penalty_and_interest] DEFAULT ((0)) NOT NULL,
    [collection_fee_annual_amount]   NUMERIC (14, 2) NULL,
    [collection_fee_type]            VARCHAR (10)    NULL,
    [collection_fee_id]              INT             NULL,
    [calc_penalty_on_bond_interest]  BIT             DEFAULT ((0)) NOT NULL,
    [calc_interest_on_bond_interest] BIT             DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_payout_agreement] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_payout_agreement_agreement_type_cd] FOREIGN KEY ([agreement_type_cd]) REFERENCES [dbo].[payout_agreement_type] ([payout_agreement_type_cd]),
    CONSTRAINT [CFK_payout_agreement_collection_fee_id] FOREIGN KEY ([collection_fee_id]) REFERENCES [dbo].[fee] ([fee_id]),
    CONSTRAINT [CFK_payout_agreement_payment_terms_type_cd] FOREIGN KEY ([payment_terms_type_cd]) REFERENCES [dbo].[payment_terms_type] ([payment_terms_type_cd]),
    CONSTRAINT [CFK_payout_agreement_status_cd] FOREIGN KEY ([status_cd]) REFERENCES [dbo].[payout_agreement_status_code] ([payout_agreement_status_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Amount of annual collection fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payout_agreement', @level2type = N'COLUMN', @level2name = N'collection_fee_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Type of annual collection fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payout_agreement', @level2type = N'COLUMN', @level2name = N'collection_fee_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Annual collection fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'payout_agreement', @level2type = N'COLUMN', @level2name = N'collection_fee_annual_amount';


GO

