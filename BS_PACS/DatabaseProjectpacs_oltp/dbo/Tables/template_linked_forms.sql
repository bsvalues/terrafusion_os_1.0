CREATE TABLE [dbo].[template_linked_forms] (
    [id]           INT          NOT NULL,
    [primary_form] VARCHAR (50) NOT NULL,
    [linked_form]  VARCHAR (50) NOT NULL,
    [type]         VARCHAR (50) NOT NULL,
    [linked_id]    INT          NOT NULL,
    CONSTRAINT [PK_template_linked_forms] PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Unique Id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_linked_forms', @level2type = N'COLUMN', @level2name = N'id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'The driving form of the template.  The form name must mactch exactly the form anme in the template_allowed_forms table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_linked_forms', @level2type = N'COLUMN', @level2name = N'primary_form';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'An allowed secondary form for the template.  The form name must mactch exactly the form anme in the template_allowed_forms table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_linked_forms', @level2type = N'COLUMN', @level2name = N'linked_form';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Form type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_linked_forms', @level2type = N'COLUMN', @level2name = N'type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Id of the linked form', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'template_linked_forms', @level2type = N'COLUMN', @level2name = N'linked_id';


GO

