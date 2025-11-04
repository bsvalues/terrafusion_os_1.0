CREATE TABLE [dbo].[_rbk_tblStatementInfo] (
    [statement_id]              INT         NULL,
    [year]                      NUMERIC (4) NULL,
    [prop_id]                   INT         NULL,
    [is_current_year_statement] BIT         NULL,
    [payment_group_id]          INT         NULL,
    [cy_statement_id]           INT         NULL,
    [cy_year]                   NUMERIC (4) NULL,
    [original_statement_id]     INT         NULL,
    [is_additional_statement]   BIT         NULL
);


GO

