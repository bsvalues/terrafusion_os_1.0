CREATE TABLE [dbo].[current_activity_log] (
    [row_id]              INT            IDENTITY (1, 1) NOT NULL,
    [process_name]        VARCHAR (100)  NULL,
    [status_msg]          VARCHAR (3000) NULL,
    [execution_time]      DATETIME       CONSTRAINT [CDF_current_activity_log_execution_time] DEFAULT (getdate()) NULL,
    [row_count]           BIGINT         NULL,
    [err_status]          INT            NULL,
    [login_name]          VARCHAR (255)  CONSTRAINT [CDF_current_activity_log_login_name] DEFAULT (suser_sname()) NULL,
    [username]            VARCHAR (255)  CONSTRAINT [CDF_current_activity_log_username] DEFAULT (user_name()) NULL,
    [database_name]       VARCHAR (128)  CONSTRAINT [CDF_current_activity_log_database_name] DEFAULT (db_name()) NOT NULL,
    [process_id]          SMALLINT       CONSTRAINT [CDF_current_activity_log_process_id] DEFAULT (@@spid) NOT NULL,
    [application_name]    VARCHAR (100)  CONSTRAINT [CDF_current_activity_log_application_name] DEFAULT (app_name()) NULL,
    [computer_name]       VARCHAR (100)  CONSTRAINT [CDF_current_activity_log_computer_name] DEFAULT (host_name()) NULL,
    [duration_in_seconds] INT            NULL,
    CONSTRAINT [CPK__current_activity_log] PRIMARY KEY CLUSTERED ([row_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Allows for logging of how long step or process took in seconds', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'current_activity_log', @level2type = N'COLUMN', @level2name = N'duration_in_seconds';


GO

