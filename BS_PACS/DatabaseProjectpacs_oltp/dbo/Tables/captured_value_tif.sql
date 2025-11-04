CREATE TABLE [dbo].[captured_value_tif] (
    [captured_value_run_id]      INT          NOT NULL,
    [year]                       NUMERIC (4)  NOT NULL,
    [tax_district_id]            INT          NOT NULL,
    [levy_cd]                    VARCHAR (10) NOT NULL,
    [tax_area_id]                INT          NOT NULL,
    [is_joint_district_value]    BIT          NOT NULL,
    [tif_area_id]                INT          NOT NULL,
    [tif_taxable_value]          NUMERIC (14) NULL,
    [tif_base_value]             NUMERIC (14) NULL,
    [tif_new_const_value]        NUMERIC (14) NULL,
    [tif_state_value]            NUMERIC (14) NULL,
    [tif_prev_state_value]       NUMERIC (14) NULL,
    [tif_senior_taxable_value]   NUMERIC (14) NULL,
    [tif_senior_base_value]      NUMERIC (14) NULL,
    [tif_senior_new_const_value] NUMERIC (14) NULL,
    CONSTRAINT [CPK_captured_value_tif] PRIMARY KEY CLUSTERED ([captured_value_run_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [tax_area_id] ASC, [is_joint_district_value] ASC, [tif_area_id] ASC)
);


GO

