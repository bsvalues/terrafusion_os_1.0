CREATE TABLE [dbo].[bill_adjust_code] (
    [adjust_cd]         VARCHAR (10) NOT NULL,
    [adjust_desc]       VARCHAR (50) NOT NULL,
    [deferral_cd]       CHAR (1)     NULL,
    [alert_user]        CHAR (1)     NULL,
    [use_penalty]       CHAR (1)     NULL,
    [penalty_rate]      NUMERIC (4)  NULL,
    [use_interest]      CHAR (1)     NULL,
    [interest_rate]     NUMERIC (4)  NULL,
    [use_attorney_fee]  CHAR (1)     NULL,
    [attorney_fee_rate] NUMERIC (4)  NULL,
    [use_range]         CHAR (1)     NULL,
    [begin_range]       NUMERIC (4)  NULL,
    [end_range]         NUMERIC (4)  NULL,
    [sys_flag]          CHAR (1)     NULL,
    [judgement_cd]      CHAR (1)     NULL,
    CONSTRAINT [CPK_bill_adjust_code] PRIMARY KEY CLUSTERED ([adjust_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

