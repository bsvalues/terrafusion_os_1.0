CREATE TABLE [dbo].[arbitration_method] (
    [method_cd]   VARCHAR (10) NOT NULL,
    [method_desc] VARCHAR (50) NULL,
    [sys_flag]    BIT          NULL,
    CONSTRAINT [CPK_arbitration_method] PRIMARY KEY CLUSTERED ([method_cd] ASC)
);


GO

