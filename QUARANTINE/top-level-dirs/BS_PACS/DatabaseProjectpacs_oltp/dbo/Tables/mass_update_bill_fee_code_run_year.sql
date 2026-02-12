CREATE TABLE [dbo].[mass_update_bill_fee_code_run_year] (
    [run_id] INT NOT NULL,
    [year]   INT NOT NULL,
    CONSTRAINT [CPK_mass_update_bill_fee_code_run_year] PRIMARY KEY CLUSTERED ([run_id] ASC, [year] ASC),
    CONSTRAINT [CFK_mass_update_bill_fee_code_run_year_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[mass_update_bill_fee_code_run] ([run_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_year', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Tax Year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_year', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mass Update Bill Fee Code Run year assoc Table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run_year';


GO

