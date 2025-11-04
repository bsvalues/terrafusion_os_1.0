CREATE TABLE [dbo].[arbitration_status] (
    [status_cd]   VARCHAR (10) NOT NULL,
    [status_desc] VARCHAR (50) NULL,
    [letter_id]   INT          NULL,
    [open_close]  BIT          NULL,
    [sys_flag]    BIT          NULL,
    CONSTRAINT [CPK_arbitration_status] PRIMARY KEY CLUSTERED ([status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

