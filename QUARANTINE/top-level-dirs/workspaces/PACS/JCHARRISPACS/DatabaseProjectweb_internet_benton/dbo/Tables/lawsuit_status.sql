CREATE TABLE [dbo].[lawsuit_status] (
    [status_cd]        VARCHAR (10) NOT NULL,
    [status_desc]      VARCHAR (50) NULL,
    [new_default_flag] BIT          NULL,
    [inactive_flag]    BIT          NULL,
    CONSTRAINT [CPK_lawsuit_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

