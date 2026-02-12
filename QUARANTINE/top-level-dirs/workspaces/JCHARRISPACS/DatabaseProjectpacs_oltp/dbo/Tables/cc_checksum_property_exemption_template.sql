CREATE TABLE [dbo].[cc_checksum_property_exemption_template] (
    [exmpt_tax_yr]  NUMERIC (4)  NOT NULL,
    [owner_tax_yr]  NUMERIC (4)  NOT NULL,
    [sup_num]       INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [owner_id]      INT          NOT NULL,
    [exmpt_type_cd] VARCHAR (10) NOT NULL,
    [checksum_val]  INT          NULL
);


GO

