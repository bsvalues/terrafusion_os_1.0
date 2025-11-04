CREATE TABLE [dbo].[entity_exmpt] (
    [entity_id]                  INT              NOT NULL,
    [exmpt_type_cd]              VARCHAR (10)     NOT NULL,
    [exmpt_tax_yr]               NUMERIC (4)      NOT NULL,
    [entity_exmpt_desc]          VARCHAR (50)     NULL,
    [special_exmpt]              CHAR (1)         NULL,
    [local_option_pct]           NUMERIC (13, 10) NULL,
    [state_mandate_amt]          NUMERIC (14)     NULL,
    [local_option_min_amt]       NUMERIC (14)     NULL,
    [local_option_amt]           NUMERIC (14)     NULL,
    [apply_pct_ownrship]         CHAR (1)         NULL,
    [freeze_flag]                BIT              NOT NULL,
    [transfer_flag]              BIT              NOT NULL,
    [set_initial_freeze_date]    DATETIME         NULL,
    [set_initial_freeze_user_id] INT              NULL,
    CONSTRAINT [CPK_entity_exmpt] PRIMARY KEY CLUSTERED ([entity_id] ASC, [exmpt_tax_yr] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_exmpt_type_cd]
    ON [dbo].[entity_exmpt]([exmpt_type_cd] ASC) WITH (FILLFACTOR = 100);


GO

