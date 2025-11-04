CREATE TABLE [dbo].[mobile_assignment_group] (
    [mobile_assignment_group_id]          VARCHAR (10) NOT NULL,
    [mobile_assignment_group_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_mobile_assignment_group] PRIMARY KEY CLUSTERED ([mobile_assignment_group_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Property Assignment Group', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mobile_assignment_group';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique id value for record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mobile_assignment_group', @level2type = N'COLUMN', @level2name = N'mobile_assignment_group_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mobile assignment group display value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mobile_assignment_group', @level2type = N'COLUMN', @level2name = N'mobile_assignment_group_description';


GO

