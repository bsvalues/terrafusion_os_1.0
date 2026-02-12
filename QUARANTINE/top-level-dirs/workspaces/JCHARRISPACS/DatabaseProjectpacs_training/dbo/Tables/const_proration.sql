CREATE TABLE [dbo].[const_proration] (
    [year]                NUMERIC (4)      NOT NULL,
    [tax_district_id]     INT              NOT NULL,
    [levy_cd]             VARCHAR (10)     NOT NULL,
    [proration_level]     INT              NOT NULL,
    [proration_amount]    NUMERIC (13, 10) NULL,
    [protected_amount]    NUMERIC (13, 10) NULL,
    [use_full_amount]     BIT              NOT NULL,
    [protect_full_amount] BIT              NOT NULL,
    CONSTRAINT [CPK_const_proration] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [proration_level] ASC) WITH (FILLFACTOR = 100)
);


GO

