CREATE TABLE [dbo].[___tafa] (
    [year]            NUMERIC (4)  NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [fund_id]         INT          NOT NULL,
    [tax_area_id]     INT          NOT NULL,
    [begin_date]      DATETIME     NULL,
    [end_date]        DATETIME     NULL
);


GO

CREATE NONCLUSTERED INDEX [#ndx_tafa]
    ON [dbo].[___tafa]([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [tax_area_id] ASC);


GO

