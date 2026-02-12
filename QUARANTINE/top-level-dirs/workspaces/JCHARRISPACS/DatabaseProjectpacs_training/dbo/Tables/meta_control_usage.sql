CREATE TABLE [dbo].[meta_control_usage] (
    [control_usage_id]   INT           NOT NULL,
    [control_usage_desc] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_meta_control_usage] PRIMARY KEY CLUSTERED ([control_usage_id] ASC) WITH (FILLFACTOR = 100)
);


GO

