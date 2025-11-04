CREATE TABLE [dbo].[_20240515_rbk_DO95365_payment_transaction_assoc] (
    [transaction_id]     INT             NOT NULL,
    [trans_group_id]     INT             NOT NULL,
    [base_amount]        NUMERIC (14, 2) NOT NULL,
    [base_amount_pd]     NUMERIC (14, 2) NOT NULL,
    [penalty_amount_pd]  NUMERIC (14, 2) NOT NULL,
    [interest_amount_pd] NUMERIC (14, 2) NOT NULL,
    [bond_interest_pd]   NUMERIC (14, 2) NOT NULL,
    [transaction_type]   VARCHAR (25)    NULL,
    [underage_amount_pd] NUMERIC (14, 2) NOT NULL,
    [overage_amount_pd]  NUMERIC (14, 2) NOT NULL,
    [other_amount_pd]    NUMERIC (14, 2) NOT NULL,
    [pacs_user_id]       INT             NULL,
    [transaction_date]   DATETIME        NULL,
    [batch_id]           INT             NOT NULL,
    [create_date]        DATETIME        NOT NULL
);


GO

