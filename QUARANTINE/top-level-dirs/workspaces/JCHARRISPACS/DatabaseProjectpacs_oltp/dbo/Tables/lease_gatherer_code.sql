CREATE TABLE [dbo].[lease_gatherer_code] (
    [gatherer_cd] VARCHAR (20) NOT NULL,
    [gatherer_nm] VARCHAR (50) NOT NULL,
    [sys_flag]    VARCHAR (1)  NULL,
    CONSTRAINT [CPK_lease_gatherer_code] PRIMARY KEY CLUSTERED ([gatherer_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

