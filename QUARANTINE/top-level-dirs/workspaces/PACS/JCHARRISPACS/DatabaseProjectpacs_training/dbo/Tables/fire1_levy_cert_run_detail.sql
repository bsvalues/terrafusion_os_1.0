CREATE TABLE [dbo].[fire1_levy_cert_run_detail] (
    [levy_cert_run_id]     INT              NOT NULL,
    [year]                 NUMERIC (4)      NOT NULL,
    [tax_district_id]      INT              NOT NULL,
    [levy_cd]              VARCHAR (10)     NOT NULL,
    [levy_rate]            NUMERIC (13, 10) NULL,
    [tax_base]             NUMERIC (14, 2)  NULL,
    [outstanding_item_cnt] INT              NULL,
    [final_levy_rate]      NUMERIC (13, 10) NULL,
    [budget_amount]        NUMERIC (14, 2)  NULL
);


GO

