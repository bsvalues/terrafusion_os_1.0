CREATE TABLE [dbo].[auto_balance_sup_group_report] (
    [validation_id] INT          NOT NULL,
    [entity_id]     INT          NOT NULL,
    [prop_val_yr]   NUMERIC (14) NOT NULL,
    [sup_num]       INT          NOT NULL,
    [column_name]   VARCHAR (25) NOT NULL,
    [vt_cur_val]    NUMERIC (14) NOT NULL,
    [vt_prev_val]   NUMERIC (14) NOT NULL,
    [sup_group_val] NUMERIC (14) NOT NULL,
    CONSTRAINT [CPK_auto_balance_sup_group_report] PRIMARY KEY CLUSTERED ([validation_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [column_name] ASC) WITH (FILLFACTOR = 100)
);


GO

