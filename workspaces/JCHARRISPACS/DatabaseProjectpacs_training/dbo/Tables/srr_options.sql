CREATE TABLE [dbo].[srr_options] (
    [option_id]        INT            IDENTITY (1, 1) NOT NULL,
    [pacs_user_id]     INT            NOT NULL,
    [sup_group_id]     INT            NOT NULL,
    [create_dt]        DATETIME       NULL,
    [lock_dt]          DATETIME       NULL,
    [accept_dt]        DATETIME       NULL,
    [bill_create_dt]   DATETIME       NULL,
    [sort_order]       VARCHAR (50)   NULL,
    [entities]         VARCHAR (1024) NULL,
    [year]             NUMERIC (4)    NULL,
    [group_by_action]  BIT            NULL,
    [total_pages_only] BIT            NULL,
    [begin_page]       INT            NULL,
    [end_page]         INT            NULL,
    [run_dt]           DATETIME       NULL,
    CONSTRAINT [CPK_srr_options] PRIMARY KEY CLUSTERED ([option_id] ASC) WITH (FILLFACTOR = 100)
);


GO

