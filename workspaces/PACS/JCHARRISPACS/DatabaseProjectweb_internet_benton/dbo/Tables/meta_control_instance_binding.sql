CREATE TABLE [dbo].[meta_control_instance_binding] (
    [customization_id]    INT           IDENTITY (1, 1) NOT NULL,
    [container_namespace] VARCHAR (256) NOT NULL,
    [paragraph_type]      VARCHAR (256) NOT NULL,
    [paragraph_depth]     VARCHAR (50)  NOT NULL,
    [label_description]   VARCHAR (50)  NOT NULL,
    [bound_control_type]  VARCHAR (256) NOT NULL,
    [field_binding]       NTEXT         NOT NULL,
    [hotkey]              NTEXT         NULL,
    [validation]          NTEXT         NULL,
    [object_type]         INT           NOT NULL,
    [sub_type]            INT           NOT NULL,
    [role]                INT           NOT NULL,
    [role_type]           INT           NOT NULL,
    [workflow]            INT           NOT NULL,
    [activity]            INT           NOT NULL,
    CONSTRAINT [CPK_meta_control_instance_binding] PRIMARY KEY CLUSTERED ([customization_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC)
);


GO

