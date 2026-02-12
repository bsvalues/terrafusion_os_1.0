CREATE TABLE [dbo].[ccAssignmentGroupQueue] (
    [prop_id]     INT         NOT NULL,
    [run_id]      INT         NOT NULL,
    [action_type] VARCHAR (1) NOT NULL,
    CONSTRAINT [CPK_ccAssignmentGroupQueue] PRIMARY KEY CLUSTERED ([prop_id] ASC, [run_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property Id value of the property with changes to be synced', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccAssignmentGroupQueue', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'If property was inserted (I), deleted (D), or updated (U)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccAssignmentGroupQueue', @level2type = N'COLUMN', @level2name = N'action_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS Mobile Assignment Group Changes for syncing with Cloud. Table is empty when there is nothing to sync', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ccAssignmentGroupQueue';


GO

