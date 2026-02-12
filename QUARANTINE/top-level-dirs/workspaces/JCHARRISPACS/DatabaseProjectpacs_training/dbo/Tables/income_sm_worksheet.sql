CREATE TABLE [dbo].[income_sm_worksheet] (
    [event_id]                   INT           NOT NULL,
    [income_id]                  INT           NOT NULL,
    [econ_area]                  VARCHAR (10)  NULL,
    [property_type]              VARCHAR (10)  NULL,
    [expense_structure]          VARCHAR (10)  NULL,
    [rent_type]                  VARCHAR (10)  NULL,
    [class]                      VARCHAR (10)  NULL,
    [year_built]                 NUMERIC (4)   NULL,
    [level]                      VARCHAR (10)  NULL,
    [property_name]              VARCHAR (50)  NULL,
    [stories]                    VARCHAR (10)  NULL,
    [comments]                   VARCHAR (255) NULL,
    [value_method]               VARCHAR (5)   NULL,
    [method_value]               NUMERIC (14)  NULL,
    [less_personal_property]     NUMERIC (14)  NULL,
    [leaseup_costs]              NUMERIC (14)  NULL,
    [other_value]                NUMERIC (14)  NULL,
    [other_land_value]           NUMERIC (14)  NULL,
    [base_indicated_value]       NUMERIC (14)  NULL,
    [non_income_land_imps_value] NUMERIC (14)  NULL,
    [total_indicated_value]      NUMERIC (14)  NULL,
    CONSTRAINT [CPK_income_sm_worksheet] PRIMARY KEY CLUSTERED ([event_id] ASC),
    CONSTRAINT [CFK_income_sm_worksheet_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id])
);


GO

