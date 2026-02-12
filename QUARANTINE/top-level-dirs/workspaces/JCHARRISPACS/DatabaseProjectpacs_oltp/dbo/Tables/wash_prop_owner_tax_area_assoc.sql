CREATE TABLE [dbo].[wash_prop_owner_tax_area_assoc] (
    [year]        NUMERIC (4) NOT NULL,
    [sup_num]     INT         NOT NULL,
    [prop_id]     INT         NOT NULL,
    [owner_id]    INT         NOT NULL,
    [tax_area_id] INT         NOT NULL,
    [pending]     BIT         NULL,
    CONSTRAINT [CPK_wash_prop_owner_tax_area_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [tax_area_id] ASC) WITH (FILLFACTOR = 90)
);


GO

