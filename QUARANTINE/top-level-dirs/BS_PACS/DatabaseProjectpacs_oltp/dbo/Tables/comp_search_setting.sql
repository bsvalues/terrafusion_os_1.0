CREATE TABLE [dbo].[comp_search_setting] (
    [setting_id]                           INT          NOT NULL,
    [search_type]                          VARCHAR (1)  NOT NULL,
    [sales_equity_flag]                    BIT          NOT NULL,
    [year]                                 NUMERIC (4)  NOT NULL,
    [name]                                 VARCHAR (80) NOT NULL,
    [global_flag]                          BIT          NOT NULL,
    [created_by_user_id]                   INT          NOT NULL,
    [created_date]                         DATETIME     NOT NULL,
    [sold_flag]                            BIT          NOT NULL,
    [return_as_of_sale_info]               BIT          NOT NULL,
    [default_flag]                         BIT          NOT NULL,
    [include_only_multiple_property_sales] BIT          NOT NULL,
    [exclude_only_multiple_property_sales] BIT          NOT NULL,
    CONSTRAINT [CPK_comp_search_setting] PRIMARY KEY CLUSTERED ([setting_id] ASC) WITH (FILLFACTOR = 100)
);


GO

