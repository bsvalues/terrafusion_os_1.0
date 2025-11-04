CREATE TABLE [dbo].[land_misc_code_adj_lookup_config] (
    [year]         NUMERIC (4)    NOT NULL,
    [element_type] VARCHAR (15)   NOT NULL,
    [is_active]    BIT            NOT NULL,
    [lookup_query] VARCHAR (1023) NOT NULL,
    CONSTRAINT [CPK_land_misc_code_adj_lookup_config] PRIMARY KEY CLUSTERED ([year] ASC, [element_type] ASC)
);


GO

