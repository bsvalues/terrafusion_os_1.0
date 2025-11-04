CREATE TABLE [dbo].[levy_exemption] (
    [year]            NUMERIC (4)  NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [exmpt_type_cd]   VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_levy_exemption] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

