CREATE TABLE [dbo].[mm_detail_criteria] (
    [mm_id]       INT            NOT NULL,
    [seq_num]     INT            NOT NULL,
    [criteria_id] INT            NOT NULL,
    [type]        VARCHAR (5)    NOT NULL,
    [field_name]  VARCHAR (100)  NOT NULL,
    [operation]   INT            NOT NULL,
    [value]       VARCHAR (3000) NULL,
    [value_id]    INT            NULL,
    [andor]       VARCHAR (3)    CONSTRAINT [CDF_mm_detail_criteria_andor] DEFAULT ('') NOT NULL,
    [groupnumber] INT            CONSTRAINT [CDF_mm_detail_criteria_groupnumber] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_mm_detail_criteria] PRIMARY KEY CLUSTERED ([mm_id] ASC, [seq_num] ASC, [criteria_id] ASC),
    CONSTRAINT [mm_detail_criteria_andor] CHECK ([andor]='or' OR [andor]='and' OR [andor]=''),
    CONSTRAINT [mm_detail_criteria_groupnumber] CHECK ([groupnumber]>(0))
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicate that the column can be joined with AND or OR', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mm_detail_criteria', @level2type = N'COLUMN', @level2name = N'andor';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The group number associated with the andor column to group constraints ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mm_detail_criteria', @level2type = N'COLUMN', @level2name = N'groupnumber';


GO

