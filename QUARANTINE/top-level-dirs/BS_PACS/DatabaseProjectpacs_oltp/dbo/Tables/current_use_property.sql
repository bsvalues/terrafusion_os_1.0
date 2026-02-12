CREATE TABLE [dbo].[current_use_property] (
    [run_id]  INT NOT NULL,
    [prop_id] INT NOT NULL,
    CONSTRAINT [PK_current_use_property_run_id_prop_id] PRIMARY KEY CLUSTERED ([run_id] ASC, [prop_id] ASC),
    FOREIGN KEY ([run_id]) REFERENCES [dbo].[current_use_property_run] ([run_id]),
    CONSTRAINT [CFK_current_use_property_current_use_property_run] FOREIGN KEY ([run_id]) REFERENCES [dbo].[current_use_property_run] ([run_id])
);


GO

