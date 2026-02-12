CREATE TABLE [dbo].[tax_district_type] (
    [tax_district_type_cd] VARCHAR (10) NOT NULL,
    [tax_district_desc]    VARCHAR (50) NULL,
    [sys_flag]             BIT          NULL,
    [priority]             INT          NOT NULL,
    [is_city]              BIT          NULL,
    CONSTRAINT [CPK_tax_district_type] PRIMARY KEY CLUSTERED ([tax_district_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

