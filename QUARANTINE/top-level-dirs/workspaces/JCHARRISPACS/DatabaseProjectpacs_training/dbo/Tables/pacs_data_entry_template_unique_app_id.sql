CREATE TABLE [dbo].[pacs_data_entry_template_unique_app_id] (
    [next_id]     INT NOT NULL,
    [template_id] INT NOT NULL,
    CONSTRAINT [pk_pacs_data_entry_template_unique_app_id] PRIMARY KEY CLUSTERED ([template_id] ASC, [next_id] ASC)
);


GO

