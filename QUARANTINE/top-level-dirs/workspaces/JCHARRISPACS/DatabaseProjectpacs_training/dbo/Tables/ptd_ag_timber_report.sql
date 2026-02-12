CREATE TABLE [dbo].[ptd_ag_timber_report] (
    [dataset_id]                  BIGINT          NOT NULL,
    [entity_id]                   INT             NOT NULL,
    [year]                        NUMERIC (4)     NOT NULL,
    [page_num]                    INT             NOT NULL,
    [state_cd]                    VARCHAR (10)    NULL,
    [state_land_type_desc]        VARCHAR (10)    NULL,
    [land_type_cd]                VARCHAR (10)    NULL,
    [ls_code]                     VARCHAR (25)    NULL,
    [number_land_detail]          NUMERIC (14)    NULL,
    [acres]                       NUMERIC (18, 4) NULL,
    [market_value]                NUMERIC (14)    NULL,
    [productivity_use_value]      NUMERIC (14)    NULL,
    [average_prod_value_per_acre] NUMERIC (14)    NULL,
    [productivity_loss]           NUMERIC (14)    NULL,
    [ag_tim_wdlf_flag]            CHAR (1)        NULL
);


GO

