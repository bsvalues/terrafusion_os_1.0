CREATE TABLE [dbo].[mass_update_bill_fee_code_run] (
    [run_id]                   INT            NOT NULL,
    [created_by]               INT            NOT NULL,
    [created_date]             DATETIME       NOT NULL,
    [prop_count]               INT            DEFAULT ((0)) NULL,
    [bill_fee_code]            VARCHAR (10)   NULL,
    [comment]                  VARCHAR (500)  NOT NULL,
    [crit_special_assessments] VARCHAR (MAX)  NOT NULL,
    [crit_tax_districts]       VARCHAR (MAX)  NOT NULL,
    [crit_bill_fee_codes]      VARCHAR (3000) NULL,
    [crit_fee_type]            VARCHAR (MAX)  NOT NULL,
    [crit_bill_due_date]       DATETIME       NULL,
    [crit_include_paid_bills]  BIT            NULL,
    [crit_search_type]         VARCHAR (10)   NULL,
    [crit_propertyIds]         VARCHAR (MAX)  NOT NULL,
    [crit_sqlquery]            VARCHAR (MAX)  NOT NULL,
    [crit_taxyears]            VARCHAR (3000) NULL,
    CONSTRAINT [CPK_mass_update_bill_fee_code_run] PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Search Type Standard/Property ID/SQL Query ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_search_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS User ID of user who ran the Update', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'created_by';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Fee Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_fee_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Property IDs', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_propertyIds';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Date/Time update was run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'created_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Bill Due Date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_bill_due_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mass Update Bill Fee Code Run Table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Special Assessments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_special_assessments';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: SQL Query', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_sqlquery';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = '# of properties that were updated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'prop_count';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Tax Districts', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_tax_districts';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Tax Years', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_taxyears';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bill / Fee code that was used in the update', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'bill_fee_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Include Paid Bills Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_include_paid_bills';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Search Criteria: Bill / Fee Codes', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_bill_fee_code_run', @level2type = N'COLUMN', @level2name = N'crit_bill_fee_codes';


GO

