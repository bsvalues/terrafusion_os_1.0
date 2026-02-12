CREATE TABLE [dbo].[land_misc_code] (
    [misc_cd]   VARCHAR (6)  NOT NULL,
    [misc_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_land_misc_code] PRIMARY KEY CLUSTERED ([misc_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

