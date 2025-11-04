CREATE TABLE [dbo].[meta_workflow_object_type] (
    [object_type_id]               INT            IDENTITY (1, 1) NOT NULL,
    [type_qualified_name]          NVARCHAR (128) NOT NULL,
    [type_assembly_qualified_name] NVARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_meta_workflow_object_type] PRIMARY KEY CLUSTERED ([object_type_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [idx_type_qualified_name_type_assembly_qualified_name]
    ON [dbo].[meta_workflow_object_type]([type_qualified_name] ASC, [type_assembly_qualified_name] ASC) WITH (IGNORE_DUP_KEY = ON);


GO

