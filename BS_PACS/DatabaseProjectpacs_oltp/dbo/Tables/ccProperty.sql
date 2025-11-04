CREATE TABLE [dbo].[ccProperty] (
    [prop_id]                    INT          NOT NULL,
    [prop_val_yr]                DECIMAL (4)  NOT NULL,
    [sup_num]                    INT          NOT NULL,
    [mobile_assignment_group_id] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_ccProperty] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC),
    CONSTRAINT [CFK_ccProperty_mobile_assignment_group_id] FOREIGN KEY ([mobile_assignment_group_id]) REFERENCES [dbo].[mobile_assignment_group] ([mobile_assignment_group_id])
);


GO

