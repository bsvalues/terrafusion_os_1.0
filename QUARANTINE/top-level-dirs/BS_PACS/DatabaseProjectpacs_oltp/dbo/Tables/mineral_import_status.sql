CREATE TABLE [dbo].[mineral_import_status] (
    [run_id]         INT          NOT NULL,
    [status_code]    VARCHAR (20) NOT NULL,
    [status_user_id] INT          NOT NULL,
    [status_date]    DATETIME     NOT NULL,
    CONSTRAINT [CFK_mineral_import_status_status_code] FOREIGN KEY ([status_code]) REFERENCES [dbo].[mineral_import_status_code] ([status_code]),
    CONSTRAINT [CFK_mineral_import_status_status_user_id] FOREIGN KEY ([status_user_id]) REFERENCES [dbo].[pacs_user] ([pacs_user_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_status]([run_id] ASC) WITH (FILLFACTOR = 90);


GO

