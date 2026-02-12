CREATE TABLE [dbo].[sup_group_entity_summary] (
    [sup_group_id]    INT             NOT NULL,
    [sup_yr]          NUMERIC (4)     NOT NULL,
    [sup_num]         INT             NOT NULL,
    [prop_id]         INT             NOT NULL,
    [entity_id]       INT             NOT NULL,
    [sup_action]      CHAR (1)        NOT NULL,
    [entity_cd]       VARCHAR (5)     NOT NULL,
    [pacs_user_id]    INT             NOT NULL,
    [curr_assessed]   NUMERIC (14)    NULL,
    [curr_exemptions] NUMERIC (14)    NULL,
    [curr_taxable]    NUMERIC (14)    NULL,
    [curr_tax]        NUMERIC (14, 2) NULL,
    [prev_assessed]   NUMERIC (14)    NULL,
    [prev_exemptions] NUMERIC (14)    NULL,
    [prev_taxable]    NUMERIC (14)    NULL,
    [prev_tax]        NUMERIC (14, 2) NULL,
    [gl_assessed]     NUMERIC (14)    NULL,
    [gl_exemptions]   NUMERIC (14)    NULL,
    [gl_taxable]      NUMERIC (14)    NULL,
    [gl_tax]          NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_sup_group_entity_summary] PRIMARY KEY CLUSTERED ([sup_group_id] ASC, [sup_yr] ASC, [sup_num] ASC, [prop_id] ASC, [entity_id] ASC, [sup_action] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_sup_group_entity_summary_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id])
);


GO

