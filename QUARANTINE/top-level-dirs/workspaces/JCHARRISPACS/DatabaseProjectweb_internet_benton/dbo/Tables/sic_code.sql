CREATE TABLE [dbo].[sic_code] (
    [sic_cd]             VARCHAR (10) NOT NULL,
    [sic_desc]           VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [category_appraiser] INT          NULL,
    CONSTRAINT [CPK_sic_code] PRIMARY KEY CLUSTERED ([sic_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

