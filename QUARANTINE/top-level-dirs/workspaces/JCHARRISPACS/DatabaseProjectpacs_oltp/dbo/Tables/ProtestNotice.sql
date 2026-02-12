CREATE TABLE [dbo].[ProtestNotice] (
    [ComputerName] VARCHAR (25)   NOT NULL,
    [prop_id]      INT            NOT NULL,
    [owner_id]     INT            NOT NULL,
    [tax_year]     NUMERIC (5)    NOT NULL,
    [Status]       INT            NOT NULL,
    [Pages]        INT            NOT NULL,
    [Image]        VARCHAR (1024) NOT NULL,
    [acct_id]      INT            NOT NULL,
    [acct_type]    INT            NOT NULL,
    [type_cd]      VARCHAR (10)   NOT NULL,
    [Answers]      VARCHAR (128)  NULL,
    [time_stamp]   DATETIME       NULL,
    CONSTRAINT [CPK_ProtestNotice] PRIMARY KEY CLUSTERED ([ComputerName] ASC, [prop_id] ASC, [owner_id] ASC, [tax_year] ASC, [Status] ASC, [acct_id] ASC, [acct_type] ASC, [type_cd] ASC) WITH (FILLFACTOR = 80)
);


GO

