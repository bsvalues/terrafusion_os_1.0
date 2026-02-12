CREATE TABLE [dbo].[arbitration_contact_type] (
    [contact_type_cd] VARCHAR (10) NOT NULL,
    [contact_desc]    VARCHAR (50) NULL,
    [sys_flag]        BIT          NULL,
    CONSTRAINT [CPK_arbitration_contact_type] PRIMARY KEY CLUSTERED ([contact_type_cd] ASC)
);


GO

