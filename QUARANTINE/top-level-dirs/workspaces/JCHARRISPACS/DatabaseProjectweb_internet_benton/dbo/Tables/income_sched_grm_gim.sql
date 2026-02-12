CREATE TABLE [dbo].[income_sched_grm_gim] (
    [year]                           NUMERIC (4)    NOT NULL,
    [prop_type_cd]                   VARCHAR (10)   NOT NULL,
    [class_cd]                       VARCHAR (10)   NOT NULL,
    [econ_cd]                        VARCHAR (10)   NOT NULL,
    [level_cd]                       VARCHAR (10)   NOT NULL,
    [potential_gross_income_annual]  NUMERIC (14)   NOT NULL,
    [potential_gross_income_monthly] NUMERIC (14)   NOT NULL,
    [gross_income_multiplier]        NUMERIC (5, 2) NOT NULL,
    [gross_rent_multiplier]          NUMERIC (5, 2) NOT NULL,
    CONSTRAINT [CPK_income_sched_grm_gim] PRIMARY KEY CLUSTERED ([year] ASC, [prop_type_cd] ASC, [class_cd] ASC, [econ_cd] ASC, [level_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

