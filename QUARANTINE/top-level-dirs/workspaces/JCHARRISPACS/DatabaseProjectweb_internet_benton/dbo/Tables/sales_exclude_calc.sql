CREATE TABLE [dbo].[sales_exclude_calc] (
    [sales_exclude_calc_cd]   VARCHAR (10) NOT NULL,
    [sales_exclude_calc_desc] VARCHAR (50) NULL,
    [sys_flag]                CHAR (1)     NULL,
    CONSTRAINT [CPK_sales_exclude_calc] PRIMARY KEY CLUSTERED ([sales_exclude_calc_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

