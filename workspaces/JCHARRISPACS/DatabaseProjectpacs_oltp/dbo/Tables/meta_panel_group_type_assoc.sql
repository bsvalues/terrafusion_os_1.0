CREATE TABLE [dbo].[meta_panel_group_type_assoc] (
    [meta_panel_type_name] VARCHAR (50) NOT NULL,
    [meta_panel_group_id]  INT          NOT NULL,
    CONSTRAINT [CPK_meta_panel_group_type_assoc] PRIMARY KEY CLUSTERED ([meta_panel_type_name] ASC, [meta_panel_group_id] ASC)
);


GO

