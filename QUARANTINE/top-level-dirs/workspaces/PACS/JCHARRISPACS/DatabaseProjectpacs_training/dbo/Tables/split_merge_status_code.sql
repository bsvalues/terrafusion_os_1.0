CREATE TABLE [dbo].[split_merge_status_code] (
    [status_code]        VARCHAR (10) NOT NULL,
    [status_description] VARCHAR (50) NULL,
    CONSTRAINT [CPK_split_merge_status_code] PRIMARY KEY CLUSTERED ([status_code] ASC)
);


GO

