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
    [override_penalty_and_interest]  BIT             NOT NULL,
    [collection_fee_annual_amount]   NUMERIC (14, 2) NULL,
    [collection_fee_type]            VARCHAR (10)    NULL,
    [collection_fee_id]              INT             NULL,
    [calc_penalty_on_bond_interest]  BIT             NOT NULL,
    [calc_interest_on_bond_interest] BIT             NOT NULL,
    CONSTRAINT [CPK_payout_agreement] PRIMARY KEY CLUSTERED ([payout_agreement_id] ASC) WITH (FILLFACTOR = 100)
);


GO

