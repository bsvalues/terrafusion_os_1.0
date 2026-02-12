CREATE TABLE [dbo].[tax_district_joint] (
    [year]                  NUMERIC (4)     NOT NULL,
    [tax_district_id]       INT             NOT NULL,
    [levy_cd]               VARCHAR (12)    NOT NULL,
    [acct_id_linked]        INT             NOT NULL,
    [assessed_value]        NUMERIC (14, 2) NULL,
    [state_assessed_value]  NUMERIC (14, 2) NULL,
    [senior_assessed_value] NUMERIC (14, 2) NULL,
    [annex_value]           NUMERIC (14, 2) NULL,
    [new_const_value]       NUMERIC (14, 2) NULL,
    [timber_assessed_full]  NUMERIC (14, 2) CONSTRAINT [CDF_tax_district_joint_timber_assessed_full] DEFAULT ((0)) NULL,
    [timber_assessed_half]  NUMERIC (14, 2) CONSTRAINT [CDF_tax_district_joint_timber_assessed_half] DEFAULT ((0)) NULL,
    [timber_assessed_roll]  NUMERIC (14, 2) CONSTRAINT [CDF_tax_district_joint_timber_assessed_roll] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_tax_district_joint] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [acct_id_linked] ASC)
);


GO

