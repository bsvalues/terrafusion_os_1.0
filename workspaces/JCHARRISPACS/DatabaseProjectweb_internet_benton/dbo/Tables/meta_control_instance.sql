CREATE TABLE [dbo].[meta_control_instance] (
    [instance_id]    INT           NOT NULL,
    [field_type_id]  INT           NULL,
    [control_usage]  INT           NULL,
    [dialog_or_view] VARCHAR (255) NULL,
    [panel_name]     VARCHAR (255) NULL,
    [path]           VARCHAR (255) NULL,
    [control_name]   VARCHAR (255) NULL,
    [label_text]     VARCHAR (255) NULL,
    [disable]        BIT           NOT NULL,
    [hide]           BIT           NOT NULL,
    CONSTRAINT [CPK_meta_control_instance] PRIMARY KEY CLUSTERED ([instance_id] ASC) WITH (FILLFACTOR = 100)
);


GO

