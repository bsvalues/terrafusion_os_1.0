CREATE TABLE [dbo].[meta_panel_type] (
    [meta_panel_type_name] VARCHAR (50) NOT NULL,
    [system]               BIT          CONSTRAINT [CDF_meta_panel_type_system] DEFAULT (0) NOT NULL,
    [object_type]          VARCHAR (5)  NULL,
    [sub_type]             VARCHAR (5)  NULL,
    CONSTRAINT [CPK_meta_panel_type] PRIMARY KEY CLUSTERED ([meta_panel_type_name] ASC)
);


GO

