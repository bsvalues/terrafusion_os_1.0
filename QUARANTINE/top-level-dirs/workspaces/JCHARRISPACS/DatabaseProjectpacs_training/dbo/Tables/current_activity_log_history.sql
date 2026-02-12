CREATE TABLE [dbo].[current_activity_log_history] (
    [process_name]        VARCHAR (100)  NULL,
    [status_msg]          VARCHAR (3000) NULL,
    [execution_time]      DATETIME       NULL,
    [row_count]           BIGINT         NULL,
    [err_status]          INT            NULL,
    [login_name]          VARCHAR (255)  NULL,
    [username]            VARCHAR (255)  NULL,
    [database_name]       VARCHAR (128)  NULL,
    [process_id]          SMALLINT       NULL,
    [application_name]    VARCHAR (100)  NULL,
    [computer_name]       VARCHAR (100)  NULL,
    [duration_in_seconds] INT            NULL
);


GO

CREATE CLUSTERED INDEX [ix_current_activity_log_history_execution_time]
    ON [dbo].[current_activity_log_history]([execution_time] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Allows for logging of how long step or process took in seconds', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'current_activity_log_history', @level2type = N'COLUMN', @level2name = N'duration_in_seconds';


GO

