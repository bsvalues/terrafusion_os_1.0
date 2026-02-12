CREATE TABLE [dbo].[Workflow] (
    [WorkflowTypeId]     INT   NOT NULL,
    [WorkflowDefinition] NTEXT NULL,
    CONSTRAINT [CFK_Workflow_WorkflowTypeId] FOREIGN KEY ([WorkflowTypeId]) REFERENCES [dbo].[Type] ([TypeId])
);


GO

CREATE UNIQUE CLUSTERED INDEX [idx_WorkflowTypeId]
    ON [dbo].[Workflow]([WorkflowTypeId] ASC) WITH (IGNORE_DUP_KEY = ON);


GO

