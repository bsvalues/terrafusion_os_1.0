CREATE TABLE [dbo].[interest_type] (
    [interest_type_cd]   VARCHAR (5)  NOT NULL,
    [interest_type_desc] VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    CONSTRAINT [CPK_interest_type] PRIMARY KEY CLUSTERED ([interest_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

