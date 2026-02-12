CREATE TABLE [dbo].[srr_entity_grand_total] (
    [option_id]       INT             NOT NULL,
    [sup_group_id]    INT             NOT NULL,
    [entity_id]       INT             NOT NULL,
    [entity_cd]       VARCHAR (5)     NOT NULL,
    [sup_action]      CHAR (1)        NOT NULL,
    [pacs_user_id]    INT             NOT NULL,
    [prop_count]      INT             NOT NULL,
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
    CONSTRAINT [CPK_srr_entity_grand_total] PRIMARY KEY CLUSTERED ([option_id] ASC, [sup_group_id] ASC, [entity_id] ASC, [sup_action] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_srr_entity_grand_total_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id])
);


GO

