CREATE TABLE [dbo].[prelim_property_entity_exemption] (
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
    CONSTRAINT [CPK_prelim_property_entity_exemption] PRIMARY KEY CLUSTERED ([owner_tax_yr] ASC, [exmpt_tax_yr] ASC, [sup_num] ASC, [entity_id] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[prelim_property_entity_exemption]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

