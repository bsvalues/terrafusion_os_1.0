CREATE TABLE [dbo].[_clientdb_deed_history_detail] (
    [prop_id]         INT          NOT NULL,
    [chg_of_owner_id] INT          NOT NULL,
    [seq_num]         INT          NOT NULL,
    [deed_dt]         VARCHAR (10) NULL,
    [deed_type_cd]    CHAR (10)    NULL,
    [deed_type_desc]  VARCHAR (50) NULL,
    [grantor]         VARCHAR (70) NULL,
    [grantee]         VARCHAR (70) NULL,
    [deed_book_id]    CHAR (20)    NULL,
    [deed_book_page]  CHAR (20)    NULL,
    [sale_date]       DATETIME     NULL,
    [sale_price]      NUMERIC (14) NULL,
    [excise_number]   INT          NULL,
    [deed_num]        VARCHAR (50) NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_deed_history_detail]
    ON [dbo].[_clientdb_deed_history_detail]([prop_id] ASC);


GO

