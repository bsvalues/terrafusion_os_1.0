CREATE TABLE [dbo].[_steve_wash_prop_owner_tax_area_assoc_20230710] (
    [year]        NUMERIC (4) NOT NULL,
    [sup_num]     INT         NOT NULL,
    [prop_id]     INT         NOT NULL,
    [owner_id]    INT         NOT NULL,
    [tax_area_id] INT         NOT NULL,
    [pending]     BIT         NULL
);


GO

