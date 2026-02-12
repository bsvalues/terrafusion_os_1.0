CREATE TABLE [dbo].[income_recalc_errors] (
    [error_id]  INT           IDENTITY (1, 1) NOT NULL,
    [income_yr] NUMERIC (4)   NOT NULL,
    [sup_num]   INT           NOT NULL,
    [income_id] INT           NOT NULL,
    [error]     VARCHAR (255) NOT NULL,
    [method]    VARCHAR (5)   NULL,
    CONSTRAINT [CPK_income_recalc_errors] PRIMARY KEY CLUSTERED ([error_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_income_yr_sup_num_income_id]
    ON [dbo].[income_recalc_errors]([income_yr] ASC, [sup_num] ASC, [income_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Valuation Method to which the error applies', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_recalc_errors', @level2type = N'COLUMN', @level2name = N'method';


GO

