CREATE TABLE [dbo].[_tmp_otr] (
    [otr_id]              INT           IDENTITY (1, 1) NOT NULL,
    [pacs_user_id]        INT           NOT NULL,
    [deed_num]            VARCHAR (50)  NULL,
    [deed_book_id]        CHAR (20)     NULL,
    [deed_book_page]      CHAR (20)     NULL,
    [deed_dt]             DATETIME      NULL,
    [coo_sl_dt]           DATETIME      NULL,
    [prop_id]             INT           NULL,
    [sup_num]             INT           NULL,
    [sup_tax_yr]          NUMERIC (4)   NULL,
    [legal_desc]          VARCHAR (255) NULL,
    [prop_type_cd]        CHAR (5)      NULL,
    [geo_id]              VARCHAR (50)  NULL,
    [seller_file_as_name] VARCHAR (70)  NULL,
    [file_as_name]        VARCHAR (70)  NULL,
    [addr_line1]          VARCHAR (60)  NULL,
    [addr_line2]          VARCHAR (60)  NULL,
    [addr_line3]          VARCHAR (60)  NULL,
    [addr_city]           VARCHAR (50)  NULL,
    [addr_state]          VARCHAR (50)  NULL,
    [addr_zip]            VARCHAR (50)  NULL,
    [entities]            VARCHAR (255) NULL
);


GO

