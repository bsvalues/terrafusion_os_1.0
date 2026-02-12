CREATE TABLE [dbo].[property_prorated_exemptions] (
    [year]          NUMERIC (4)  NOT NULL,
    [sup_num]       INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [ex_tax_year]   NUMERIC (4)  NOT NULL,
    [ex_owner_year] NUMERIC (4)  NOT NULL,
    [ex_sup_num]    INT          NOT NULL,
    [ex_prop_id]    INT          NOT NULL,
    [ex_owner_id]   INT          NOT NULL,
    [ex_type_cd]    VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_property_prorated_exemptions] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [ex_tax_year] ASC, [ex_owner_year] ASC, [ex_sup_num] ASC, [ex_prop_id] ASC, [ex_owner_id] ASC, [ex_type_cd] ASC),
    CONSTRAINT [CFK_property_prorated_exemptions_property_exemption] FOREIGN KEY ([ex_tax_year], [ex_owner_year], [ex_sup_num], [ex_prop_id], [ex_owner_id], [ex_type_cd]) REFERENCES [dbo].[property_exemption] ([exmpt_tax_yr], [owner_tax_yr], [sup_num], [prop_id], [owner_id], [exmpt_type_cd]),
    CONSTRAINT [CFK_property_prorated_exemptions_property_val] FOREIGN KEY ([year], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption key - owner ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'ex_owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption key - tax year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'ex_tax_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption key - type code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'ex_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A list of past-supplement exemptions for a property which the user has selected to be included in exemption proration.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption key - owner year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'ex_owner_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - supplement number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'sup_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption key - supplement number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'ex_sup_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption key - property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'ex_prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_prorated_exemptions', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

