CREATE TABLE [dbo].[mm_tax_area_agency_report] (
    [mm_id]      INT            NOT NULL,
    [prop_id]    INT            NOT NULL,
    [owner_name] VARCHAR (70)   NULL,
    [invalid]    BIT            DEFAULT ((0)) NOT NULL,
    [reason]     VARCHAR (1024) NULL,
    CONSTRAINT [CPK_mm_tax_area_agency_report] PRIMARY KEY CLUSTERED ([mm_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

