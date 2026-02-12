CREATE TABLE [dbo].[misc_rcpt_template_fin_account_assoc] (
    [misc_rcpt_cd]   VARCHAR (10)  NOT NULL,
    [fin_account_id] INT           NOT NULL,
    [description]    VARCHAR (100) NULL,
    [account_order]  INT           NOT NULL,
    CONSTRAINT [CFK_mr_template_fin_account_assoc_fin_account_id] FOREIGN KEY ([fin_account_id]) REFERENCES [dbo].[fin_account] ([fin_account_id]),
    CONSTRAINT [CFK_mr_template_fin_account_assoc_misc_rcpt_cd] FOREIGN KEY ([misc_rcpt_cd]) REFERENCES [dbo].[misc_rcpt_template] ([misc_rcpt_cd]),
    CONSTRAINT [CUQ_misc_rcpt_template_fin_account_assoc_account_order] UNIQUE NONCLUSTERED ([misc_rcpt_cd] ASC, [account_order] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The order of accounts in a template, from 1 to n', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'misc_rcpt_template_fin_account_assoc', @level2type = N'COLUMN', @level2name = N'account_order';


GO

