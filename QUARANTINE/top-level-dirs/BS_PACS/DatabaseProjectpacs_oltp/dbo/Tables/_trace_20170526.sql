CREATE TABLE [dbo].[_trace_20170526] (
    [id]         INT            NULL,
    [spid]       INT            NULL,
    [blocked]    SMALLINT       NULL,
    [dbName]     VARCHAR (256)  NULL,
    [cpu]        INT            NULL,
    [physicalio] BIGINT         NULL,
    [login_time] DATETIME       NULL,
    [last_batch] DATETIME       NULL,
    [hostname]   VARCHAR (256)  NULL,
    [prog_name]  VARCHAR (256)  NULL,
    [loginame]   VARCHAR (256)  NULL,
    [logdate]    DATETIME       DEFAULT (getdate()) NULL,
    [InitialCmd] VARCHAR (8000) NULL,
    [LastCmd]    VARCHAR (8000) NULL
);


GO

