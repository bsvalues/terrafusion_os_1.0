CREATE TABLE [dbo].[tax_area_mapping] (
    [annexation_id]                INT NOT NULL,
    [tax_area_source_id]           INT NOT NULL,
    [tax_area_destination_id]      INT NOT NULL,
    [tax_area_fund_source_id]      INT NOT NULL,
    [tax_area_fund_destination_id] INT NOT NULL,
    CONSTRAINT [CPK_tax_area_mapping] PRIMARY KEY CLUSTERED ([annexation_id] ASC, [tax_area_source_id] ASC, [tax_area_destination_id] ASC, [tax_area_fund_source_id] ASC, [tax_area_fund_destination_id] ASC),
    CONSTRAINT [CFK_tax_area_mapping_annexation_id] FOREIGN KEY ([annexation_id]) REFERENCES [dbo].[annexation] ([annexation_id]) ON DELETE CASCADE
);


GO

