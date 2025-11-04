CREATE TABLE [dbo].[levy_cert_run] (
    [levy_cert_run_id]                        INT              NOT NULL,
    [year]                                    NUMERIC (4)      NOT NULL,
    [description]                             VARCHAR (50)     NULL,
    [captured_value_run_id]                   INT              NOT NULL,
    [implicit_price_deflator]                 NUMERIC (13, 10) NULL,
    [general_limit_factor]                    NUMERIC (8, 5)   NULL,
    [aggregate_limit]                         NUMERIC (6, 3)   NOT NULL,
    [real_prop_ratio]                         NUMERIC (5, 4)   NOT NULL,
    [pers_prop_ratio]                         NUMERIC (5, 4)   NOT NULL,
    [status]                                  CHAR (20)        NULL,
    [created_date]                            DATETIME         NOT NULL,
    [created_by_id]                           INT              NOT NULL,
    [updated_date]                            DATETIME         NULL,
    [updated_by_id]                           INT              NULL,
    [accepted_date]                           DATETIME         NULL,
    [accepted_by_id]                          INT              NULL,
    [bills_created_date]                      DATETIME         NULL,
    [bills_created_by_id]                     INT              NULL,
    [bills_activated_date]                    DATETIME         NULL,
    [bills_activated_by_id]                   INT              NULL,
    [reduce_banked_capacity_by_refund_amount] BIT              CONSTRAINT [CDF_levy_cert_run_reduce_banked_capacity_by_refund_amount] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_levy_cert_run] PRIMARY KEY CLUSTERED ([levy_cert_run_id] ASC, [year] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Reduce banked capacity by the refund amount or not, in highest lawful levy calculations', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_cert_run', @level2type = N'COLUMN', @level2name = N'reduce_banked_capacity_by_refund_amount';


GO

