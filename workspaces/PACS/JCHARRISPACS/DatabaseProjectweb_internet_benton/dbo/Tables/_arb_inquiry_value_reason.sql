CREATE TABLE [dbo].[_arb_inquiry_value_reason] (
    [assigned_value_reason_cd]   VARCHAR (10) NOT NULL,
    [assigned_value_reason_desc] VARCHAR (50) NULL,
    [sys_flag]                   CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_inquiry_value_reason] PRIMARY KEY CLUSTERED ([assigned_value_reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

