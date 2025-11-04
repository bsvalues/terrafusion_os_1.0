CREATE TABLE [dbo].[income_sched] (
    [income_yr]           NUMERIC (4)     NOT NULL,
    [econ_area]           VARCHAR (10)    NOT NULL,
    [prop_type]           VARCHAR (10)    NOT NULL,
    [class_cd]            VARCHAR (10)    NOT NULL,
    [level_cd]            VARCHAR (10)    NOT NULL,
    [ocr]                 NUMERIC (5, 2)  NULL,
    [mgmtr]               NUMERIC (5, 2)  NULL,
    [exp_rsf]             NUMERIC (14, 2) NULL,
    [si_rsf]              NUMERIC (14, 2) NULL,
    [tir]                 NUMERIC (5, 2)  NULL,
    [rrr]                 NUMERIC (5, 2)  NULL,
    [capr]                NUMERIC (5, 2)  NULL,
    [lease_rsf]           NUMERIC (14, 2) NULL,
    [vacancy]             NUMERIC (5, 2)  NULL,
    [do_not_use_tax_rate] BIT             NOT NULL,
    [triple_net_schedule] BIT             NOT NULL,
    CONSTRAINT [CPK_income_sched] PRIMARY KEY CLUSTERED ([income_yr] ASC, [econ_area] ASC, [prop_type] ASC, [class_cd] ASC, [level_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

