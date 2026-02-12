CREATE TABLE [dbo].[fin_coll_transaction_assoc] (
    [fin_transaction_id]    INT            NOT NULL,
    [posted_transaction_id] INT            NOT NULL,
    [percentage]            NUMERIC (5, 2) CONSTRAINT [CDF_fin_coll_transaction_assoc_percentage] DEFAULT ((100.00)) NOT NULL,
    [fee_mr_detail_id]      INT            NULL,
    CONSTRAINT [CPK_fin_coll_transaction_assoc] PRIMARY KEY CLUSTERED ([fin_transaction_id] ASC, [posted_transaction_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_fin_coll_transaction_assoc_fin_transaction_id] FOREIGN KEY ([fin_transaction_id]) REFERENCES [dbo].[fin_transaction] ([fin_transaction_id]),
    CONSTRAINT [CFK_fin_coll_transaction_assoc_posted_transaction_id] FOREIGN KEY ([posted_transaction_id]) REFERENCES [dbo].[posted_coll_transaction] ([posted_transaction_id])
);


GO

CREATE NONCLUSTERED INDEX [IDX_fin_coll_transaction_assoc_fin_transaction_id]
    ON [dbo].[fin_coll_transaction_assoc]([fin_transaction_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IDX_fin_coll_transaction_assoc_posted_transaction_id]
    ON [dbo].[fin_coll_transaction_assoc]([posted_transaction_id] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Provides a link between fin_transaction and any associated Misc. Receipt Fee Detail record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_coll_transaction_assoc', @level2type = N'COLUMN', @level2name = N'fee_mr_detail_id';


GO

