CREATE TABLE [dbo].[prelim_entity_prop_assoc] (
    [entity_id]          INT              NOT NULL,
    [prop_id]            INT              NOT NULL,
    [entity_prop_id]     VARCHAR (50)     NULL,
    [entity_prop_pct]    NUMERIC (13, 10) NULL,
    [conv_taxable_val]   INT              NULL,
    [conv_taxable_value] NUMERIC (14, 2)  NULL,
    [sup_num]            INT              NOT NULL,
    [tax_yr]             NUMERIC (4)      NOT NULL,
    [annex_yr]           NUMERIC (4)      NULL,
    [entity_taxable_val] NUMERIC (14)     NULL,
    CONSTRAINT [CPK_prelim_entity_prop_assoc] PRIMARY KEY CLUSTERED ([tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 95)
);


GO

