CREATE TABLE [dbo].[freeze_ceiling_run] (
    [run_id]                INT           IDENTITY (80, 1) NOT NULL,
    [year]                  NUMERIC (4)   NOT NULL,
    [run_type_id]           INT           NOT NULL,
    [supplement_properties] BIT           NOT NULL,
    [sup_group_id]          INT           NULL,
    [sup_cd]                VARCHAR (10)  NULL,
    [sup_desc]              VARCHAR (500) NULL,
    [preview_date]          DATETIME      NULL,
    [preview_user_id]       INT           NULL,
    [process_date]          DATETIME      NULL,
    [process_user_id]       INT           NULL,
    [undo_date]             DATETIME      NULL,
    [undo_user_id]          INT           NULL,
    [accepted_sup_group_id] INT           NULL,
    CONSTRAINT [CPK_freeze_ceiling_run] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_freeze_ceiling_run_run_type_id] FOREIGN KEY ([run_type_id]) REFERENCES [dbo].[freeze_ceiling_run_type] ([run_type_id])
);


GO

