CREATE TABLE [dbo].[income_pf_criteria] (
    [criteria_id]     INT          NOT NULL,
    [grm_gim_flag]    BIT          CONSTRAINT [CDF_income_pf_criteria_grm_gim_flag] DEFAULT ((0)) NOT NULL,
    [criteria_date]   DATETIME     NOT NULL,
    [description]     VARCHAR (25) NULL,
    [ad_hoc_criteria] BIT          CONSTRAINT [CDF_income_pf_criteria_ad_hoc_criteria] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_pf_criteria] PRIMARY KEY CLUSTERED ([criteria_id] ASC) WITH (FILLFACTOR = 100)
);


GO

