CREATE TABLE [dbo].[prelim_property_tax_area] (
    [year]                NUMERIC (4) NOT NULL,
    [sup_num]             INT         NOT NULL,
    [prop_id]             INT         NOT NULL,
    [tax_area_id]         INT         NOT NULL,
    [tax_area_id_pending] INT         NULL,
    [effective_date]      DATETIME    NULL,
    CONSTRAINT [CPK_prelim_property_tax_area] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

