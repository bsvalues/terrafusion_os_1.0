CREATE TABLE [dbo].[sys_security_event] (
    [application] VARCHAR (50)  NOT NULL,
    [user_id]     INT           NOT NULL,
    [machine_id]  VARCHAR (50)  NOT NULL,
    [date_time]   DATETIME      NOT NULL,
    [os_version]  VARCHAR (250) NULL,
    CONSTRAINT [CPK_sys_security_event] PRIMARY KEY CLUSTERED ([application] ASC, [user_id] ASC, [machine_id] ASC, [date_time] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'To save application launched', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sys_security_event', @level2type = N'COLUMN', @level2name = N'application';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'To Save user id entered', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sys_security_event', @level2type = N'COLUMN', @level2name = N'user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'To save the machine name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sys_security_event', @level2type = N'COLUMN', @level2name = N'machine_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'To save the date and time of the event', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sys_security_event', @level2type = N'COLUMN', @level2name = N'date_time';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'To track the user logins', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sys_security_event';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Operating System Version', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sys_security_event', @level2type = N'COLUMN', @level2name = N'os_version';


GO

