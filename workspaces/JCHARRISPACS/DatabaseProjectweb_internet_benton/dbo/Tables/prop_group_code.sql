CREATE TABLE [dbo].[prop_group_code] (
    [group_cd]           VARCHAR (20)  NOT NULL,
    [group_desc]         VARCHAR (50)  NULL,
    [sys_flag]           VARCHAR (1)   NULL,
    [alert_user]         CHAR (1)      NULL,
    [comments]           VARCHAR (500) NULL,
    [alert_reet_present] CHAR (1)      NULL,
    [create_id]          INT           NOT NULL,
    [create_dt]          DATETIME      NOT NULL,
    [alert_role]         CHAR (1)      NOT NULL,
    [notify_comment]     VARCHAR (80)  NULL,
    [inactive]           BIT           NOT NULL,
    [mh_movement]        BIT           NOT NULL,
    CONSTRAINT [CPK_prop_group_code] PRIMARY KEY CLUSTERED ([group_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

