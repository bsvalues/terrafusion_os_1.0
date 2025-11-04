CREATE TABLE [dbo].[bld_permit_type] (
    [bld_permit_type_cd] VARCHAR (10) NOT NULL,
    [bld_permit_desc]    VARCHAR (50) NULL,
    [permit_type_flag]   CHAR (1)     NULL,
    [sys_flag]           CHAR (1)     NULL,
    CONSTRAINT [CPK_bld_permit_type] PRIMARY KEY CLUSTERED ([bld_permit_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

