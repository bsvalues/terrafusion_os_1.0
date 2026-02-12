CREATE TABLE [dbo].[___tmpctz] (
    [transaction_id] INT      NOT NULL,
    [trans_group_id] INT      NOT NULL,
    [balance_dt]     DATETIME NULL
);


GO

CREATE NONCLUSTERED INDEX [#ndx_tmpctz]
    ON [dbo].[___tmpctz]([trans_group_id] ASC);


GO

