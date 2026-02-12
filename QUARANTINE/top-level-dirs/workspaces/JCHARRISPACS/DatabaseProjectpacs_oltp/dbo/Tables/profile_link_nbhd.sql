CREATE TABLE [dbo].[profile_link_nbhd] (
    [hood_cd]      VARCHAR (10) NOT NULL,
    [abs_subdv_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_profile_link_nbhd] PRIMARY KEY CLUSTERED ([hood_cd] ASC, [abs_subdv_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

