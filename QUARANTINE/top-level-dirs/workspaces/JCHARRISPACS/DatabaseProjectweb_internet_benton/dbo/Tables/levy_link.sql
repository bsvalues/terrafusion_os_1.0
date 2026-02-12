CREATE TABLE [dbo].[levy_link] (
    [tax_district_id] INT          NOT NULL,
    [year]            NUMERIC (4)  NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [levy_cd_linked]  VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_levy_link] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [levy_cd_linked] ASC)
);


GO

