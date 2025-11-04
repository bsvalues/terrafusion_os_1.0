CREATE TABLE [dbo].[reappraisal_status] (
    [reappraisal_status_cd]   VARCHAR (20) NOT NULL,
    [reappraisal_status_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_reappraisal_status] PRIMARY KEY CLUSTERED ([reappraisal_status_cd] ASC)
);


GO

