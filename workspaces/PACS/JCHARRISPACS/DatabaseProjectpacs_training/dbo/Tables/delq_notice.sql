CREATE TABLE [dbo].[delq_notice] (
    [delq_notice_id]        INT              IDENTITY (1, 1) NOT NULL,
    [pacs_user_id]          INT              NOT NULL,
    [print_dt]              DATETIME         NULL,
    [notice_dt]             DATETIME         NULL,
    [notice_heading]        VARCHAR (1)      NULL,
    [month_1]               VARCHAR (50)     NULL,
    [month_2]               VARCHAR (50)     NULL,
    [month_3]               VARCHAR (50)     NULL,
    [comment]               VARCHAR (500)    NULL,
    [prop_id]               INT              NULL,
    [owner_id]              INT              NULL,
    [payee_id]              INT              NULL,
    [agent_id]              INT              NULL,
    [prop_type_cd]          VARCHAR (20)     NULL,
    [ml_deliverable]        VARCHAR (1)      NULL,
    [geo_id]                VARCHAR (50)     NULL,
    [legal_acreage]         NUMERIC (14, 4)  NULL,
    [legal_desc]            VARCHAR (255)    NULL,
    [pct_ownership]         NUMERIC (13, 10) NULL,
    [owner_file_as_name]    VARCHAR (70)     NULL,
    [owner_addr_line1]      VARCHAR (60)     NULL,
    [owner_addr_line2]      VARCHAR (60)     NULL,
    [owner_addr_line3]      VARCHAR (60)     NULL,
    [owner_addr_city]       VARCHAR (50)     NULL,
    [owner_addr_state]      VARCHAR (50)     NULL,
    [owner_addr_country_cd] VARCHAR (5)      NULL,
    [owner_addr_zip]        VARCHAR (50)     NULL,
    [payee_file_as_name]    VARCHAR (70)     NULL,
    [payee_addr_line1]      VARCHAR (60)     NULL,
    [payee_addr_line2]      VARCHAR (60)     NULL,
    [payee_addr_line3]      VARCHAR (60)     NULL,
    [payee_addr_city]       VARCHAR (50)     NULL,
    [payee_addr_state]      VARCHAR (50)     NULL,
    [payee_addr_country_cd] VARCHAR (5)      NULL,
    [payee_addr_zip]        VARCHAR (50)     NULL,
    [status]                VARCHAR (1)      NULL,
    [situs_display]         VARCHAR (150)    NULL,
    [dba_name]              VARCHAR (50)     NULL,
    [adjustment_codes]      VARCHAR (100)    NULL,
    CONSTRAINT [CPK_delq_notice] PRIMARY KEY CLUSTERED ([delq_notice_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_pacs_user_id_status]
    ON [dbo].[delq_notice]([pacs_user_id] ASC, [status] ASC) WITH (FILLFACTOR = 90);


GO

