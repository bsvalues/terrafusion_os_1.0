CREATE TABLE [dbo].[mhm_type_code] (
    [mhm_type_cd]   VARCHAR (10) NOT NULL,
    [mhm_type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_mhm_type_code] PRIMARY KEY CLUSTERED ([mhm_type_cd] ASC)
);


GO

