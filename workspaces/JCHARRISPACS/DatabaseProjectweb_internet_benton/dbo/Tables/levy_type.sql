CREATE TABLE [dbo].[levy_type] (
    [levy_type_cd]   VARCHAR (10) NOT NULL,
    [levy_type_desc] VARCHAR (50) NULL,
    [generated_by]   INT          NULL,
    [sys_flag]       BIT          NULL,
    [levy_part]      INT          NOT NULL,
    CONSTRAINT [CPK_levy_type] PRIMARY KEY CLUSTERED ([levy_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

