CREATE TABLE [dbo].[property_entity_exemption_preview] (
    [pacs_user_id]  INT            NOT NULL,
    [prop_id]       INT            NOT NULL,
    [owner_id]      INT            NOT NULL,
    [sup_num]       INT            NOT NULL,
    [exmpt_tax_yr]  NUMERIC (4)    NOT NULL,
    [owner_tax_yr]  NUMERIC (4)    NOT NULL,
    [exmpt_type_cd] VARCHAR (10)   NOT NULL,
    [entity_id]     INT            NOT NULL,
    [state_amt]     NUMERIC (14)   NULL,
    [local_amt]     NUMERIC (14)   NULL,
    [prorate_pct]   NUMERIC (5, 4) NULL,
    CONSTRAINT [CPK_property_entity_exemption_preview] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [owner_tax_yr] ASC, [exmpt_tax_yr] ASC, [sup_num] ASC, [entity_id] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

