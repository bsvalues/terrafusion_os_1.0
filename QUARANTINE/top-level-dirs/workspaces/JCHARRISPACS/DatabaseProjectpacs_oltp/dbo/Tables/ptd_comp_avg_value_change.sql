CREATE TABLE [dbo].[ptd_comp_avg_value_change] (
    [arb_set_prev_value] CHAR (1)      NULL,
    [prev_category]      CHAR (5)      NULL,
    [curr_category]      CHAR (5)      NULL,
    [prop_id]            INT           NULL,
    [prev_market_value]  NUMERIC (14)  NULL,
    [curr_market_value]  NUMERIC (14)  NULL,
    [new_value]          NUMERIC (14)  NULL,
    [prev_partial_comp]  CHAR (1)      NULL,
    [sale_price]         NUMERIC (14)  NULL,
    [sale_dt]            DATETIME      NULL,
    [legal_desc]         VARCHAR (255) NULL,
    [entity_cd]          CHAR (5)      NULL,
    [deed_type]          VARCHAR (50)  NULL,
    [sale_type]          VARCHAR (50)  NULL
);


GO

