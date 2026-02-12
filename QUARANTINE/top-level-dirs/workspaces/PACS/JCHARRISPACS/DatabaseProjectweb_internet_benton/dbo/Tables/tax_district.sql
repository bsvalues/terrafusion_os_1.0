CREATE TABLE [dbo].[tax_district] (
    [tax_district_id]      INT          NOT NULL,
    [tax_district_cd]      VARCHAR (20) NOT NULL,
    [tax_district_desc]    VARCHAR (50) NULL,
    [tax_district_type_cd] VARCHAR (10) NOT NULL,
    [fin_vendor_id]        INT          NULL,
    [fin_vendor_site_id]   INT          NULL,
    [location_code]        VARCHAR (10) NULL,
    [location_desc]        VARCHAR (30) NULL,
    CONSTRAINT [CPK_tax_district] PRIMARY KEY CLUSTERED ([tax_district_id] ASC) WITH (FILLFACTOR = 100)
);


GO

