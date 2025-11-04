CREATE TABLE [dbo].[workflow_activity_user_assignment_queue] (
    [queue_internal_id]           BIGINT           IDENTITY (1, 1) NOT NULL,
    [workflow_instance_guid]      UNIQUEIDENTIFIER NOT NULL,
    [activity_instance_guid]      UNIQUEIDENTIFIER NOT NULL,
    [activity_designcontext_guid] UNIQUEIDENTIFIER NOT NULL,
    [assigned_role_id]            INT              NOT NULL,
    [assigned_user_id]            INT              NULL,
    [date_assigned]               DATETIME         NULL,
    [previous_assigned_user_id]   INT              NULL,
    CONSTRAINT [CPK_workflow_activity_user_assignment_queue] PRIMARY KEY CLUSTERED ([queue_internal_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_activity_instance_guid]
    ON [dbo].[workflow_activity_user_assignment_queue]([activity_instance_guid] ASC);


GO

