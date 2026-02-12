CREATE TABLE [dbo].[meta_subset_view_group] (
    [meta_subset_view_group_id] INT           NOT NULL,
    [type]                      VARCHAR (255) NOT NULL,
    [group_name]                VARCHAR (50)  NOT NULL,
    [object_type]               INT           NOT NULL,
    [sub_type]                  INT           NOT NULL,
    [role]                      INT           NOT NULL,
    [role_type]                 INT           NOT NULL,
    [workflow]                  INT           NOT NULL,
    [activity]                  INT           NOT NULL,
    [group_description]         VARCHAR (255) NULL,
    [system]                    BIT           NOT NULL,
    CONSTRAINT [CPK_meta_subset_view_group] PRIMARY KEY CLUSTERED ([meta_subset_view_group_id] ASC, [type] ASC, [group_name] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC)
);


GO

