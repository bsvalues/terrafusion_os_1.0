CREATE TABLE [dbo].[ccCheckSum_property_exemption_old] (
    [exmpt_tax_yr]  NUMERIC (4)  NOT NULL,
    [owner_tax_yr]  NUMERIC (4)  NOT NULL,
    [sup_num]       INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [owner_id]      INT          NOT NULL,
    [exmpt_type_cd] VARCHAR (10) NOT NULL,
    [checksum_val]  INT          NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_property_exemption_old]([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC);


GO

