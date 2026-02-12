CREATE TABLE [dbo].[posted_coll_transaction] (
    [posted_transaction_id] INT             IDENTITY (1, 1) NOT NULL,
    [transaction_id]        INT             NOT NULL,
    [trans_group_id]        INT             NOT NULL,
    [base_amount]           NUMERIC (14, 2) NOT NULL,
    [base_amount_pd]        NUMERIC (14, 2) NOT NULL,
    [penalty_amount_pd]     NUMERIC (14, 2) NOT NULL,
    [interest_amount_pd]    NUMERIC (14, 2) NOT NULL,
    [bond_interest_pd]      NUMERIC (14, 2) NOT NULL,
    [transaction_type]      VARCHAR (10)    NOT NULL,
    [underage_amount_pd]    NUMERIC (14, 2) NOT NULL,
    [overage_amount_pd]     NUMERIC (14, 2) NOT NULL,
    [pacs_user_id]          INT             NOT NULL,
    [transaction_date]      DATETIME        NOT NULL,
    [posted_date]           DATETIME        NOT NULL,
    [effective_date]        DATETIME        NOT NULL,
    [other_amount_pd]       NUMERIC (14, 2) NULL,
    [recorded_date]         DATETIME        NULL,
    [is_reopen]             BIT             NOT NULL,
    CONSTRAINT [CPK_posted_coll_transaction] PRIMARY KEY CLUSTERED ([posted_transaction_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [IDX_posted_coll_transaction_transaction_id]
    ON [dbo].[posted_coll_transaction]([transaction_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_recorded_date]
    ON [dbo].[posted_coll_transaction]([recorded_date] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_trans_group_id]
    ON [dbo].[posted_coll_transaction]([trans_group_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_effective_date]
    ON [dbo].[posted_coll_transaction]([effective_date] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Was this transaction posted from closing or reopening a batch?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'posted_coll_transaction', @level2type = N'COLUMN', @level2name = N'is_reopen';


GO

