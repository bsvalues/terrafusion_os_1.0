CREATE TABLE [dbo].[subset] (
    [subset_code]      VARCHAR (5)    NOT NULL,
    [subset_desc]      VARCHAR (50)   NULL,
    [sys_flag]         CHAR (1)       NULL,
    [subset_imprv_pct] NUMERIC (5, 2) NULL,
    [subset_land_pct]  NUMERIC (5, 2) NULL,
    CONSTRAINT [CPK_subset] PRIMARY KEY CLUSTERED ([subset_code] ASC) WITH (FILLFACTOR = 90)
);


GO

