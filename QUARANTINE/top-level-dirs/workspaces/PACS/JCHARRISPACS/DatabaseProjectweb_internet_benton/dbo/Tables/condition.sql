CREATE TABLE [dbo].[condition] (
    [condition_cd]   CHAR (5)     NOT NULL,
    [condition_desc] VARCHAR (50) NULL,
    [sys_flag]       CHAR (1)     NULL,
    [rc_type]        CHAR (1)     NULL,
    CONSTRAINT [CPK_condition] PRIMARY KEY CLUSTERED ([condition_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

