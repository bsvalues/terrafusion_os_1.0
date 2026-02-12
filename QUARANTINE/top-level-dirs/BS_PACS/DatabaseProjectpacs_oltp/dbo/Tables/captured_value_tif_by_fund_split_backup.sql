CREATE TABLE [dbo].[captured_value_tif_by_fund_split_backup] (
    [captured_value_run_id]      INT          NOT NULL,
    [year]                       NUMERIC (4)  NOT NULL,
    [tax_district_id]            INT          NOT NULL,
    [levy_cd]                    VARCHAR (10) NOT NULL,
    [fund_id]                    INT          NOT NULL,
    [tax_area_id]                INT          NOT NULL,
    [real_pers_value]            NUMERIC (14) NULL,
    [state_value]                NUMERIC (14) NULL,
    [senior_value]               NUMERIC (14) NULL,
    [annex_value]                NUMERIC (14) NULL,
    [new_const_value]            NUMERIC (14) NULL,
    [taxable_value]              NUMERIC (14) NULL,
    [is_joint_district_value]    BIT          NOT NULL,
    [real_value]                 NUMERIC (14) NULL,
    [personal_value]             NUMERIC (14) NULL,
    [senior_real_value]          NUMERIC (14) NULL,
    [senior_personal_value]      NUMERIC (14) NULL,
    [exempted_senior_value]      NUMERIC (14) NULL,
    [state_value_annex]          NUMERIC (16) NULL,
    [active_tif_area_id]         INT          NULL,
    [tif_taxable_value]          NUMERIC (14) NULL,
    [tif_base_value]             NUMERIC (14) NULL,
    [tif_new_const_value]        NUMERIC (14) NULL,
    [tif_state_value]            NUMERIC (14) NULL,
    [senior_new_const_value]     NUMERIC (14) NULL,
    [senior_annex_value]         NUMERIC (14) NULL,
    [tif_senior_taxable_value]   NUMERIC (14) NULL,
    [tif_senior_base_value]      NUMERIC (14) NULL,
    [tif_senior_new_const_value] NUMERIC (14) NULL,
    [tif_prev_state_value]       NUMERIC (14) NULL
);


GO

