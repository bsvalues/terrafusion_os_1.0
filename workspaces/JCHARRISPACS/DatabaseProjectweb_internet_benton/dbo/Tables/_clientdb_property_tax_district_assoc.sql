CREATE TABLE [dbo].[_clientdb_property_tax_district_assoc] (
    [prop_id]         INT          NOT NULL,
    [prop_val_yr]     NUMERIC (4)  NOT NULL,
    [tax_district_cd] VARCHAR (20) NOT NULL
);


GO

CREATE NONCLUSTERED INDEX [idx__clientdb_property_tax_district_assoc]
    ON [dbo].[_clientdb_property_tax_district_assoc]([prop_val_yr] ASC, [prop_id] ASC, [tax_district_cd] ASC);


GO

