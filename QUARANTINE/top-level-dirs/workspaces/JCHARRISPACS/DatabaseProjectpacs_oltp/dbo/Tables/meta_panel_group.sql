CREATE TABLE [dbo].[meta_panel_group] (
    [meta_panel_group_id] INT          IDENTITY (1, 1) NOT NULL,
    [group_name]          VARCHAR (50) NOT NULL,
    [system]              BIT          DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_meta_panel_group] PRIMARY KEY CLUSTERED ([meta_panel_group_id] ASC)
);


GO

