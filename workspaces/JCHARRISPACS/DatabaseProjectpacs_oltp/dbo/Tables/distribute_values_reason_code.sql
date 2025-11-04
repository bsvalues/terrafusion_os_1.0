CREATE TABLE [dbo].[distribute_values_reason_code] (
    [dist_val_reason_cd]   VARCHAR (5)  NOT NULL,
    [dist_val_reason_desc] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_dist_val_reason_cd] PRIMARY KEY CLUSTERED ([dist_val_reason_cd] ASC)
);


GO

