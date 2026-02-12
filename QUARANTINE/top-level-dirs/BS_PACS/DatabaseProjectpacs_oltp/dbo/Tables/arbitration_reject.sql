CREATE TABLE [dbo].[arbitration_reject] (
    [reject_cd]   VARCHAR (10) NOT NULL,
    [reject_desc] VARCHAR (50) NULL,
    [sys_flag]    BIT          NULL,
    CONSTRAINT [CPK_arbitration_reject] PRIMARY KEY CLUSTERED ([reject_cd] ASC)
);


GO

