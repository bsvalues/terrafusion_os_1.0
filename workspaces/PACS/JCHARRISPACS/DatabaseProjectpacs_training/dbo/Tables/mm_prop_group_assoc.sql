CREATE TABLE [dbo].[mm_prop_group_assoc] (
    [mm_id]         INT          NOT NULL,
    [seq_num]       INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [prop_group_cd] VARCHAR (20) NOT NULL,
    [expiration_dt] DATETIME     NULL,
    [assessment_yr] NUMERIC (4)  NULL,
    [create_dt]     DATETIME     NOT NULL,
    [create_id]     INT          NOT NULL,
    CONSTRAINT [CPK_mm_prop_group_assoc] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC, [prop_id] ASC, [prop_group_cd] ASC)
);


GO

