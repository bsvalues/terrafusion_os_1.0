CREATE TABLE [dbo].[annexation_property_history] (
    [annexation_id]       INT         NOT NULL,
    [prop_id]             INT         NOT NULL,
    [year]                NUMERIC (4) NOT NULL,
    [date_changed]        DATETIME    NOT NULL,
    [tax_area_id]         INT         NULL,
    [pending_tax_area_id] INT         NULL,
    [effective_date]      DATETIME    NULL,
    [is_annex_value]      BIT         CONSTRAINT [CDF_annexation_property_history_is_annex_value] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_annexation_property_history] PRIMARY KEY CLUSTERED ([annexation_id] ASC, [year] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_annexation_property_history_annexation_id] FOREIGN KEY ([annexation_id]) REFERENCES [dbo].[annexation] ([annexation_id]),
    CONSTRAINT [CFK_annexation_property_history_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

