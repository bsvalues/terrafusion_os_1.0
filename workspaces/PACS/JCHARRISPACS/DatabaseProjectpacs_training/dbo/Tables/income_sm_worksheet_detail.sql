CREATE TABLE [dbo].[income_sm_worksheet_detail] (
    [event_id]               INT             NOT NULL,
    [seq_num]                INT             NOT NULL,
    [imprv_id]               INT             NOT NULL,
    [imprv_det_id]           INT             NOT NULL,
    [imprv_det_type_cd]      VARCHAR (10)    NULL,
    [imprv_det_type_desc]    VARCHAR (20)    NULL,
    [imprv_det_meth_cd]      VARCHAR (10)    NULL,
    [gross_building_area]    NUMERIC (18, 1) NULL,
    [net_rentable_area]      NUMERIC (18, 1) NULL,
    [rent_rate]              NUMERIC (14, 2) NULL,
    [occupancy_pct]          NUMERIC (5, 2)  NULL,
    [reimbursed_expenses]    NUMERIC (14)    NULL,
    [secondary_income]       NUMERIC (14)    NULL,
    [gross_potential_income] NUMERIC (14)    NULL,
    [effective_gross_income] NUMERIC (14)    NULL,
    [overall_expenses]       NUMERIC (14)    NULL,
    [overall_rate]           NUMERIC (5, 2)  NULL,
    [net_operating_income]   NUMERIC (14)    NULL,
    [value]                  NUMERIC (14)    NULL,
    CONSTRAINT [CPK_income_sm_worksheet_detail] PRIMARY KEY CLUSTERED ([event_id] ASC, [seq_num] ASC),
    CONSTRAINT [CFK_income_sm_worksheet_detail_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id])
);


GO

