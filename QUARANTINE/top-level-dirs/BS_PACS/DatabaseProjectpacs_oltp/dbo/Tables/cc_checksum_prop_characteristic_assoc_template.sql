CREATE TABLE [dbo].[cc_checksum_prop_characteristic_assoc_template] (
    [prop_val_yr]       NUMERIC (4)  NOT NULL,
    [sup_num]           INT          NOT NULL,
    [sale_id]           INT          NOT NULL,
    [prop_id]           INT          NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    [attribute_cd]      VARCHAR (20) NOT NULL,
    [checksum_val]      INT          NULL
);


GO

