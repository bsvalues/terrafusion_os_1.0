CREATE TABLE [dbo].[coll_transaction] (
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
    [create_date]        DATETIME        NOT NULL,
    CONSTRAINT [CPK_coll_transaction] PRIMARY KEY CLUSTERED ([transaction_id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_trans_group_id_create_date_transaction_type]
    ON [dbo].[coll_transaction]([transaction_id] ASC, [trans_group_id] ASC, [create_date] ASC, [transaction_type] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_batch_id_transaction_id_trans_group_id]
    ON [dbo].[coll_transaction]([batch_id] ASC, [transaction_id] ASC, [trans_group_id] ASC) WITH (FILLFACTOR = 80);


GO

CREATE NONCLUSTERED INDEX [idx_transaction_create_date]
    ON [dbo].[coll_transaction]([create_date] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_trans_group_id_transaction_date]
    ON [dbo].[coll_transaction]([trans_group_id] ASC, [transaction_date] ASC);


GO

