CREATE TABLE [dbo].[meta_instance_customization] (
    [customization_id]    INT           IDENTITY (1, 1) NOT NULL,
    [container_namespace] VARCHAR (255) NOT NULL,
    [depth]               VARCHAR (128) NOT NULL,
    [target_type]         VARCHAR (255) NOT NULL,
    [enabled]             BIT           NOT NULL,
    [visible]             BIT           NOT NULL,
    [hotkey]              NTEXT         NULL,
    [validation]          NTEXT         NULL,
    [display_text]        VARCHAR (255) NOT NULL,
    [object_type]         INT           NOT NULL,
    [sub_type]            INT           NOT NULL,
    [role]                INT           NOT NULL,
    [role_type]           INT           NOT NULL,
    [workflow]            INT           NOT NULL,
    [activity]            INT           NOT NULL,
    CONSTRAINT [CPK_meta_instance_customization] PRIMARY KEY CLUSTERED ([customization_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC) WITH (FILLFACTOR = 90)
);


GO

