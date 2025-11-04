CREATE TABLE [dbo].[etr_new_ex] (
    [prop_id]               INT          NOT NULL,
    [exmpt_tax_yr]          NUMERIC (4)  NOT NULL,
    [owner_id]              INT          NOT NULL,
    [entity_id]             INT          NOT NULL,
    [pacs_user_id]          INT          NOT NULL,
    [exmpt_type_cd]         VARCHAR (10) NOT NULL,
    [geo_id]                VARCHAR (50) NULL,
    [applicant_nm]          VARCHAR (70) NULL,
    [curr_yr_exemption_amt] NUMERIC (14) NULL,
    [prev_yr_market]        NUMERIC (14) NULL,
    [run_date]              DATETIME     NULL,
    CONSTRAINT [CPK_etr_new_ex] PRIMARY KEY CLUSTERED ([prop_id] ASC, [exmpt_tax_yr] ASC, [owner_id] ASC, [entity_id] ASC, [pacs_user_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

