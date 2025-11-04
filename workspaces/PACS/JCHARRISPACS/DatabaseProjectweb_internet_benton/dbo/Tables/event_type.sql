CREATE TABLE [dbo].[event_type] (
    [event_type_cd]        CHAR (20)    NOT NULL,
    [event_type_desc]      VARCHAR (50) NULL,
    [sys_flag]             CHAR (1)     NULL,
    [event_type_flag]      CHAR (1)     NULL,
    [system_type]          CHAR (5)     NULL,
    [event_user_right]     CHAR (1)     NULL,
    [acct_type_cd]         VARCHAR (5)  NULL,
    [boe_indicator]        BIT          NOT NULL,
    [event_source_cd]      VARCHAR (20) NOT NULL,
    [inactive]             BIT          NOT NULL,
    [default_recheck_days] INT          NULL,
    CONSTRAINT [CPK_event_type] PRIMARY KEY CLUSTERED ([event_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

