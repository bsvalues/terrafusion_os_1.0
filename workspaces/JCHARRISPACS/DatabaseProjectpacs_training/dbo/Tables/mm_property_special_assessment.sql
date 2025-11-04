CREATE TABLE [dbo].[mm_property_special_assessment] (
    [mm_id]              INT             NOT NULL,
    [seq_num]            INT             NOT NULL,
    [year]               NUMERIC (4)     NOT NULL,
    [sup_num]            INT             NOT NULL,
    [prop_id]            INT             NOT NULL,
    [agency_id]          INT             NOT NULL,
    [assessment_use_cd]  CHAR (10)       NULL,
    [assessment_amt]     NUMERIC (14)    NULL,
    [additional_fee_amt] NUMERIC (14)    NULL,
    [exemption_amt]      NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_mm_property_special_assessment] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC, [year] ASC, [sup_num] ASC, [prop_id] ASC, [agency_id] ASC) WITH (FILLFACTOR = 90)
);


GO

