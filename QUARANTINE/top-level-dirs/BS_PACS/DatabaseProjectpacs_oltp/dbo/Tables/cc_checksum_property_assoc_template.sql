CREATE TABLE [dbo].[cc_checksum_property_assoc_template] (
    [prop_val_yr]    NUMERIC (4) NOT NULL,
    [sup_num]        INT         NOT NULL,
    [parent_prop_id] INT         NOT NULL,
    [child_prop_id]  INT         NOT NULL,
    [checksum_val]   INT         NULL
);


GO

