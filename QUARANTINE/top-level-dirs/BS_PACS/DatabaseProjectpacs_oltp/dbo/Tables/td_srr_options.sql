CREATE TABLE [dbo].[td_srr_options] (
    [option_id]             INT            NOT NULL,
    [pacs_user_id]          INT            NOT NULL,
    [sup_group_id]          INT            NOT NULL,
    [create_dt]             DATETIME       NOT NULL,
    [lock_dt]               DATETIME       NULL,
    [accept_dt]             DATETIME       NULL,
    [bill_create_dt]        DATETIME       NULL,
    [sort_order]            VARCHAR (50)   NULL,
    [tax_code_areas]        VARCHAR (4096) NULL,
    [year]                  NUMERIC (4)    NULL,
    [group_by_action]       BIT            NOT NULL,
    [sub_total_pages]       BIT            NOT NULL,
    [begin_page]            INT            NULL,
    [end_page]              INT            NULL,
    [run_dt]                DATETIME       NOT NULL,
    [grand_totals_only]     BIT            NOT NULL,
    [include_property_list] BIT            DEFAULT ((0)) NOT NULL,
    [display_tax_areas]     BIT            CONSTRAINT [CDF_td_srr_options_display_tax_areas] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_td_srr_options] PRIMARY KEY CLUSTERED ([option_id] ASC) WITH (FILLFACTOR = 100)
);


GO

