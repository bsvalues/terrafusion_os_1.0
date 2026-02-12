CREATE TABLE [dbo].[penpad_checkout] (
    [run_id]               INT          NOT NULL,
    [prop_id]              INT          NOT NULL,
    [market_val_check_out] NUMERIC (14) NULL,
    [market_val_check_in]  NUMERIC (14) NULL,
    [bCheckedIn]           BIT          CONSTRAINT [CDF_penpad_checkout_bCheckedIn] DEFAULT (0) NOT NULL,
    [bProcessed]           BIT          CONSTRAINT [CDF_penpad_checkout_bProcessed] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_penpad_checkout] PRIMARY KEY CLUSTERED ([run_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[penpad_checkout]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

