CREATE TABLE [dbo].[disbursement_status] (
    [status_cd]          VARCHAR (20) NOT NULL,
    [status_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_disbursement_status] PRIMARY KEY CLUSTERED ([status_cd] ASC)
);


GO

