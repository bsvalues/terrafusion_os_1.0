CREATE TABLE [dbo].[ptd_mt_state_report_acreage_wildlife] (
    [entity_id]         INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [as_of_sup_num]     INT             NOT NULL,
    [date]              DATETIME        NULL,
    [prev_land_type_cd] VARCHAR (10)    NOT NULL,
    [land_acres]        NUMERIC (11, 3) NULL,
    [land_market_val]   NUMERIC (14)    NULL,
    [land_ag_val]       NUMERIC (14)    NULL,
    [entity_type_count] INT             NULL,
    [dataset_id]        BIGINT          NOT NULL,
    CONSTRAINT [CPK_ptd_mt_state_report_acreage_wildlife] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [entity_id] ASC, [year] ASC, [as_of_sup_num] ASC, [prev_land_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

