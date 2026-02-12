CREATE TABLE [dbo].[bill_fee_code] (
    [bill_fee_cd]               VARCHAR (10)   NOT NULL,
    [bill_fee_desc]             VARCHAR (50)   NOT NULL,
    [deferral_cd]               CHAR (1)       NULL,
    [alert_user]                CHAR (1)       NULL,
    [use_penalty]               CHAR (1)       NULL,
    [penalty_rate]              NUMERIC (9, 6) NULL,
    [use_interest]              CHAR (1)       NULL,
    [interest_rate]             NUMERIC (9, 6) NULL,
    [use_attorney_fee]          CHAR (1)       NULL,
    [attorney_fee_rate]         NUMERIC (4)    NULL,
    [use_range]                 CHAR (1)       NULL,
    [begin_range]               NUMERIC (4)    NULL,
    [end_range]                 NUMERIC (4)    NULL,
    [sys_flag]                  CHAR (1)       NULL,
    [judgement_cd]              CHAR (1)       NULL,
    [partial_payment_indicator] CHAR (1)       NOT NULL,
    [force_full_pay]            BIT            NOT NULL,
    [display_on_warning_panel]  BIT            NULL,
    [bankruptcy]                BIT            NOT NULL,
    [deferral]                  BIT            NOT NULL,
    [mh_movement]               BIT            NOT NULL,
    CONSTRAINT [CPK_bill_fee_code] PRIMARY KEY CLUSTERED ([bill_fee_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

