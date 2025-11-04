CREATE TABLE [dbo].[profile_prop_list_sales] (
    [run_id]            INT             NOT NULL,
    [detail_id]         INT             NOT NULL,
    [chg_of_owner_id]   INT             NOT NULL,
    [prop_id]           INT             NOT NULL,
    [sale_dt]           DATETIME        NULL,
    [sale_price]        NUMERIC (14)    NULL,
    [sl_state_cd]       VARCHAR (5)     NULL,
    [sl_class_cd]       VARCHAR (10)    NULL,
    [sl_yr_blt]         NUMERIC (4)     NULL,
    [sl_living_area]    NUMERIC (14)    NULL,
    [sl_land_type_cd]   VARCHAR (10)    NULL,
    [fin_type]          VARCHAR (5)     NULL,
    [fin_down_payment]  NUMERIC (14)    NULL,
    [fin_int_rate]      NUMERIC (14, 3) NULL,
    [fin_yrs]           NUMERIC (4, 1)  NULL,
    [sl_comment]        VARCHAR (500)   NULL,
    [sl_price]          NUMERIC (14)    NULL,
    [adjusted_sl_price] NUMERIC (14)    NULL,
    [sl_school_id]      INT             NULL,
    [sl_city_id]        INT             NULL,
    [include_no_calc]   CHAR (1)        NULL,
    [sl_type_cd]        CHAR (5)        NULL,
    [sl_ratio_cd]       CHAR (5)        NULL,
    [eff_yr_blt]        NUMERIC (4)     NULL,
    [include_reason]    VARCHAR (30)    NULL,
    [sl_adj_rsn]        VARCHAR (50)    NULL,
    [mp_sale]           CHAR (1)        NULL,
    [sup_num]           INT             NULL,
    [prop_val_yr]       NUMERIC (4)     NULL,
    [monthly_income]    NUMERIC (14)    NULL,
    [annual_income]     NUMERIC (14)    NULL,
    CONSTRAINT [CPK_profile_prop_list_sales] PRIMARY KEY CLUSTERED ([run_id] ASC, [detail_id] ASC, [prop_id] ASC, [chg_of_owner_id] ASC) WITH (FILLFACTOR = 90)
);


GO

