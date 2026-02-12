CREATE TABLE [dbo].[deed_type] (
    [deed_type_cd]        CHAR (10)    NOT NULL,
    [deed_type_desc]      VARCHAR (50) NULL,
    [sys_flag]            CHAR (1)     NULL,
    [county_cd]           VARCHAR (10) NULL,
    [sales_ratio_type_cd] VARCHAR (5)  NULL,
    CONSTRAINT [CPK_deed_type] PRIMARY KEY CLUSTERED ([deed_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

