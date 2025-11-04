CREATE TABLE [dbo].[auto_balance_sup_group_pv_report] (
    [validation_id] INT          NOT NULL,
    [prop_val_yr]   NUMERIC (14) NOT NULL,
    [sup_num]       INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [sup_action]    CHAR (1)     NOT NULL,
    [column_name]   VARCHAR (25) NOT NULL,
    [pv_gl_val]     NUMERIC (14) NOT NULL,
    [sup_gl_val]    NUMERIC (14) NOT NULL,
    CONSTRAINT [CPK_auto_balance_sup_group_pv_report] PRIMARY KEY CLUSTERED ([validation_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC, [column_name] ASC) WITH (FILLFACTOR = 100)
);


GO

