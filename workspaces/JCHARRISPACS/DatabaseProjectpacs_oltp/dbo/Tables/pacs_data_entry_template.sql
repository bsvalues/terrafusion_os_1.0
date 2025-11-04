CREATE TABLE [dbo].[pacs_data_entry_template] (
    [template_id]             INT          NOT NULL,
    [pacs_user_id]            INT          NOT NULL,
    [template_name]           VARCHAR (20) NOT NULL,
    [template_description]    VARCHAR (50) NOT NULL,
    [default_template]        BIT          DEFAULT ((0)) NOT NULL,
    [global_template]         BIT          DEFAULT ((0)) NOT NULL,
    [template_type]           CHAR (1)     DEFAULT ('R') NOT NULL,
    [allow_new_improvement]   BIT          DEFAULT ((0)) NOT NULL,
    [global_default_template] BIT          DEFAULT ((0)) NOT NULL,
    [display_features_grid]   BIT          CONSTRAINT [CDF_pacs_data_entry_template_display_features_grid] DEFAULT ((0)) NOT NULL,
    [default_group_code]      VARCHAR (20) NULL,
    [default_event_type]      VARCHAR (20) NULL,
    CONSTRAINT [CPK_pacs_data_entry_template] PRIMARY KEY CLUSTERED ([template_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'All Templates created by the PACS Users', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Default Group Code for Template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'default_group_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag must be set to allow New Records', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'allow_new_improvement';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Description of the Template entered by the Pacs User', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'template_description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Template Name entered by the Pacs User', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'template_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Determines whether the features grid will be displayed for the template.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'display_features_grid';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates Commercial or Residential', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'template_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Pacs User creating the template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag that indicates this template is available for all users', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'global_template';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique identifier for the Template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'template_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Default Event Type for Template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'default_event_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicates this is the global default template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'global_default_template';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag that indicates this is the Pacs Users Default Template', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_data_entry_template', @level2type = N'COLUMN', @level2name = N'default_template';


GO

