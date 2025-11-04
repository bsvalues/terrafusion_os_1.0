CREATE TABLE [dbo].[property_special_entity_exemption] (
    [prop_id]         INT             NOT NULL,
    [owner_id]        INT             NOT NULL,
    [sup_num]         INT             NOT NULL,
    [exmpt_tax_yr]    NUMERIC (4)     NOT NULL,
    [owner_tax_yr]    NUMERIC (4)     NOT NULL,
    [exmpt_type_cd]   VARCHAR (10)    NOT NULL,
    [entity_id]       INT             NOT NULL,
    [sp_amt]          NUMERIC (14, 2) NULL,
    [sp_pct]          NUMERIC (9, 6)  NULL,
    [exmpt_amt]       NUMERIC (14, 2) NULL,
    [sp_value_type]   CHAR (1)        NULL,
    [sp_value_option] CHAR (1)        NULL,
    [sp_segment_amt]  NUMERIC (14)    NULL,
    [tsRowVersion]    ROWVERSION      NOT NULL,
    CONSTRAINT [CPK_property_special_entity_exemption] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [entity_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_sp_value_type]
    ON [dbo].[property_special_entity_exemption]([sp_value_type] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[property_special_entity_exemption]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

