CREATE TABLE [dbo].[fee_misc_rcpt_detail] (
    [fee_id]         INT             NOT NULL,
    [mr_detail_id]   INT             NOT NULL,
    [fin_account_id] INT             NOT NULL,
    [description]    VARCHAR (70)    NULL,
    [is_template]    BIT             DEFAULT ((0)) NOT NULL,
    [amount]         NUMERIC (14, 2) NOT NULL,
    [comment]        VARCHAR (240)   NULL,
    CONSTRAINT [CPK_fee_misc_rcpt_detail] PRIMARY KEY CLUSTERED ([fee_id] ASC, [mr_detail_id] ASC),
    CONSTRAINT [CFK_fee_misc_rcpt_detail_fee] FOREIGN KEY ([fee_id]) REFERENCES [dbo].[fee] ([fee_id]),
    CONSTRAINT [CFK_fee_misc_rcpt_detail_fin_account] FOREIGN KEY ([fin_account_id]) REFERENCES [dbo].[fin_account] ([fin_account_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Optional comment for an miscellaneous receipting account', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_misc_rcpt_detail', @level2type = N'COLUMN', @level2name = N'comment';


GO

