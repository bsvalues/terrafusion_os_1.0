CREATE TABLE [dbo].[mass_update_bill_fee_code_run_details] (
    [run_id]             INT           NOT NULL,
    [prop_id]            INT           NOT NULL,
    [year]               INT           NOT NULL,
    [sup_num]            INT           DEFAULT ((0)) NOT NULL,
    [bill_id]            INT           NOT NULL,
    [curr_bill_fee_code] VARCHAR (10)  NULL,
    [prev_bill_fee_code] VARCHAR (10)  NULL,
    [curr_comment]       VARCHAR (500) NULL,
    [prev_comment]       VARCHAR (500) NULL,
    CONSTRAINT [CPK_mass_update_bill_fee_code_run_details] PRIMARY KEY CLUSTERED ([run_id] ASC, [prop_id] ASC, [year] ASC, [sup_num] ASC, [bill_id] ASC),
    CONSTRAINT [CFK_mass_update_bill_fee_code_run_details_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[mass_update_bill_fee_code_run] ([run_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mass Update Bill Fee Code Run Details Table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bill / Fee code before the update', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'prev_bill_fee_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sup Num', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'sup_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Updated comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'curr_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bill Id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'bill_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Comment before the update', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'prev_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Updated Bill / Fee code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'curr_bill_fee_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Tax Year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_details', @level2type = N'COLUMN', @level2name = N'year';


GO

