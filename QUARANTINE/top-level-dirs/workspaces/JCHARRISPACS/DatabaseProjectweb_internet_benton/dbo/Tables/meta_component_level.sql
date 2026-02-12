CREATE TABLE [dbo].[meta_component_level] (
    [component_level_id] INT           NOT NULL,
    [component_id]       INT           NULL,
    [display_text]       VARCHAR (50)  NOT NULL,
    [description]        VARCHAR (255) NULL,
    [display_order]      INT           NOT NULL,
    [parent_level]       INT           NULL,
    [context]            VARCHAR (100) NULL,
    CONSTRAINT [CPK_meta_component_level] PRIMARY KEY CLUSTERED ([component_level_id] ASC)
);


GO

