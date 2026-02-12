CREATE TABLE [dbo].[supplement_idlist] (
    [sup_group_id]       INT         NOT NULL,
    [year]               NUMERIC (4) NOT NULL,
    [prop_id]            INT         NOT NULL,
    [statement_id]       INT         NOT NULL,
    [effective_due_date] DATETIME    NULL,
    [h1_paid]            BIT         NULL,
    [updated]            BIT         NULL,
    CONSTRAINT [CPK_supplement_idlist] PRIMARY KEY CLUSTERED ([sup_group_id] ASC, [year] ASC, [prop_id] ASC, [statement_id] ASC)
);


GO

