CREATE TABLE [dbo].[escrow_amounts_due] (
    [escrow_id]     INT             NOT NULL,
    [year]          NUMERIC (4)     NOT NULL,
    [levy_amount]   NUMERIC (14, 2) NOT NULL,
    [levy_base]     NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [levy_interest] NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [levy_penalty]  NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [sa_amount]     NUMERIC (14, 2) NOT NULL,
    [sa_base]       NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [sa_interest]   NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [sa_penalty]    NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [fee_amount]    NUMERIC (14, 2) NOT NULL,
    [fee_base]      NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [fee_interest]  NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [fee_penalty]   NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_escrow_id_year] PRIMARY KEY CLUSTERED ([escrow_id] ASC, [year] ASC),
    CONSTRAINT [FK_escrow_escrow_id3] FOREIGN KEY ([escrow_id]) REFERENCES [dbo].[escrow] ([escrow_id])
);


GO

