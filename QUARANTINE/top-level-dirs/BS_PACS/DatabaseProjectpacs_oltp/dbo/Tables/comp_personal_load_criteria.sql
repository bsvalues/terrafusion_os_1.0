CREATE TABLE [dbo].[comp_personal_load_criteria] (
    [pacs_user_id]       INT          NOT NULL,
    [sic_code]           BIT          NOT NULL,
    [area]               BIT          NOT NULL,
    [area_dev]           NUMERIC (10) NOT NULL,
    [dba]                BIT          NOT NULL,
    [situs_street]       BIT          NOT NULL,
    [value_per_area]     BIT          NOT NULL,
    [value_per_area_dev] NUMERIC (10) NOT NULL,
    [map_id]             BIT          NOT NULL,
    [mapsco]             BIT          NOT NULL,
    [tax_area_code]      BIT          NOT NULL,
    CONSTRAINT [PK_comp_personal_load_criteria] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC)
);


GO

