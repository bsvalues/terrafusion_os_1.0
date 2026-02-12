CREATE TABLE [dbo].[pending_coll_transaction] (
    [pending_transaction_id] INT             NOT NULL,
    [trans_group_id]         INT             NOT NULL,
    [base_amount]            NUMERIC (14, 2) NULL,
    [base_amount_pd]         NUMERIC (14, 2) NULL,
    [penalty_amount_pd]      NUMERIC (14, 2) NULL,
    [interest_amount_pd]     NUMERIC (14, 2) NULL,
    [bond_interest_pd]       NUMERIC (14, 2) NULL,
    [transaction_type]       VARCHAR (25)    NULL,
    [underage_amount_pd]     NUMERIC (14, 2) NULL,
    [overage_amount_pd]      NUMERIC (14, 2) NULL,
    [other_amount_pd]        NUMERIC (14, 2) NULL,
    [pacs_user_id]           INT             NULL,
    [transaction_date]       DATETIME        NULL,
    [create_date]            ROWVERSION      NULL,
    [batch_id]               INT             NULL,
    CONSTRAINT [CPK_pending_coll_transaction] PRIMARY KEY CLUSTERED ([pending_transaction_id] ASC),
    CONSTRAINT [CFK_pending_coll_transaction_trans_group_id] FOREIGN KEY ([trans_group_id]) REFERENCES [dbo].[trans_group] ([trans_group_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_trans_group_id]
    ON [dbo].[pending_coll_transaction]([trans_group_id] ASC) WITH (FILLFACTOR = 90);


GO

