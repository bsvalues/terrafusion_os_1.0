CREATE TABLE [dbo].[annexation_property_assoc] (
    [annexation_id]      INT         NOT NULL,
    [prop_id]            INT         NOT NULL,
    [accepted]           BIT         CONSTRAINT [CDF_annexation_property_assoc_accepted] DEFAULT ((0)) NOT NULL,
    [year]               NUMERIC (4) CONSTRAINT [CDF_annexation_property_assoc_year] DEFAULT ((0)) NOT NULL,
    [tax_area_source_id] INT         NULL,
    CONSTRAINT [CPK_annexation_property_assoc] PRIMARY KEY CLUSTERED ([annexation_id] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_annexation_property_assoc_annexation_id] FOREIGN KEY ([annexation_id]) REFERENCES [dbo].[annexation] ([annexation_id]),
    CONSTRAINT [CFK_annexation_property_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_year_prop_id]
    ON [dbo].[annexation_property_assoc]([year] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO

