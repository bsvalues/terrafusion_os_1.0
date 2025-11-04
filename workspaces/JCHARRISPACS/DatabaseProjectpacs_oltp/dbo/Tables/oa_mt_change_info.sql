CREATE TABLE [dbo].[oa_mt_change_info] (
    [record_type]               VARCHAR (1)      NOT NULL,
    [prop_id]                   INT              NOT NULL,
    [prop_val_yr]               INT              NOT NULL,
    [current_account_id]        INT              NOT NULL,
    [current_percentage]        NUMERIC (13, 10) NULL,
    [current_name]              VARCHAR (70)     NULL,
    [current_addr1]             VARCHAR (60)     NULL,
    [current_addr2]             VARCHAR (60)     NULL,
    [current_addr3]             VARCHAR (60)     NULL,
    [current_city]              VARCHAR (50)     NULL,
    [current_state]             VARCHAR (50)     NULL,
    [current_zip]               VARCHAR (50)     NULL,
    [current_deliverable_flag]  VARCHAR (1)      NULL,
    [current_country]           VARCHAR (50)     NULL,
    [current_confidential_flag] VARCHAR (1)      NULL,
    [prop_type_desc]            VARCHAR (50)     NULL,
    [geo_id]                    VARCHAR (50)     NULL,
    [legal_description]         VARCHAR (255)    NULL,
    [legal_acreage]             NUMERIC (14, 4)  NULL,
    [abs_subdv_cd]              VARCHAR (10)     NULL,
    [block]                     VARCHAR (50)     NULL,
    [tract_or_lot]              VARCHAR (50)     NULL,
    [entities]                  VARCHAR (80)     NULL,
    [change_reason]             VARCHAR (50)     NULL,
    [ownership_chg_dt]          DATETIME         NULL,
    [address_chg_dt]            DATETIME         NULL,
    [deed_book_id]              VARCHAR (20)     NULL,
    [deed_book_page]            VARCHAR (20)     NULL,
    [deed_type]                 VARCHAR (50)     NULL,
    [deed_num]                  VARCHAR (50)     NULL,
    [deed_dt]                   DATETIME         NULL,
    [deed_recorded_dt]          DATETIME         NULL,
    [dba_name]                  VARCHAR (50)     NULL,
    [chg_dt]                    DATETIME         NULL,
    [ref_id1]                   VARCHAR (50)     NULL,
    [ref_id2]                   VARCHAR (50)     NULL,
    [zip_cass]                  VARCHAR (31)     NULL,
    [zip_route]                 VARCHAR (31)     NULL,
    [addr_supp_flag]            VARCHAR (31)     NULL,
    [dataset_id]                BIGINT           NOT NULL,
    [ent_mailings]              CHAR (1)         NULL,
    [tax_area_number]           VARCHAR (23)     NULL,
    [sup_num]                   INT              NULL,
    [prop_type_cd]              VARCHAR (5)      NULL
);


GO

CREATE CLUSTERED INDEX [idx_dataset_id_current_account_id_chg_dt]
    ON [dbo].[oa_mt_change_info]([dataset_id] ASC, [current_account_id] ASC, [chg_dt] ASC) WITH (FILLFACTOR = 90);


GO

