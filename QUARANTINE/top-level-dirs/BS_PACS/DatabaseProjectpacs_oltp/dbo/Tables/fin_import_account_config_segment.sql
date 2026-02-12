CREATE TABLE [dbo].[fin_import_account_config_segment] (
    [view_name]      VARCHAR (255) NOT NULL,
    [segment_id]     INT           NOT NULL,
    [fms_field_name] VARCHAR (50)  NOT NULL,
    CONSTRAINT [CPK_fin_import_account_config_segment] PRIMARY KEY CLUSTERED ([view_name] ASC, [segment_id] ASC)
);


GO

