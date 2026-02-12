CREATE TABLE [dbo].[detail_payment] (
    [year]            INT             NOT NULL,
    [agency_id]       INT             NOT NULL,
    [pacs_user_id]    INT             NOT NULL,
    [check_amt]       NUMERIC (14, 2) NULL,
    [cash_amt]        NUMERIC (14, 2) NULL,
    [eft_amt]         NUMERIC (14, 2) NULL,
    [internal_amt]    NUMERIC (14, 2) NULL,
    [credit_card_amt] NUMERIC (14, 2) NULL,
    [conv_charge_amt] NUMERIC (14, 2) NULL,
    [tax_district]    VARCHAR (60)    NULL,
    [levy_code]       VARCHAR (10)    NULL,
    [base_amount]     NUMERIC (14, 2) NULL,
    [interest_pd]     NUMERIC (14, 2) NULL,
    [penalty_pd]      NUMERIC (14, 2) NULL,
    [bond_interest]   NUMERIC (14, 2) NULL,
    [overage_pd]      NUMERIC (14, 2) NULL,
    [underage_pd]     NUMERIC (14, 2) NULL,
    [total_pd]        NUMERIC (14, 2) NULL,
    [balance_due]     NUMERIC (14, 2) NULL,
    [property_id]     VARCHAR (255)   NULL,
    [owner_name]      VARCHAR (70)    NULL,
    CONSTRAINT [CPK_detail_payment] PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 90)
);


GO

