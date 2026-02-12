CREATE TABLE [dbo].[recalc_income_list_current_division] (
    [income_yr]    NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    [income_id]    INT         NOT NULL,
    [pacs_user_id] BIGINT      NOT NULL,
    CONSTRAINT [CPK_recalc_income_list_current_division] PRIMARY KEY CLUSTERED ([income_yr] ASC, [sup_num] ASC, [income_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'For use only by recalculation component', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'recalc_income_list_current_division';


GO

