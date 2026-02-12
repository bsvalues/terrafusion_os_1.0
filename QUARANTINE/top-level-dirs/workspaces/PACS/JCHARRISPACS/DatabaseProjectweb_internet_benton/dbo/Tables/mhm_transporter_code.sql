CREATE TABLE [dbo].[mhm_transporter_code] (
    [transporter_cd]   VARCHAR (10) NOT NULL,
    [transporter_desc] VARCHAR (50) NOT NULL,
    [wutc_permit_num]  VARCHAR (20) NULL,
    [dot_permit_num]   VARCHAR (20) NULL,
    CONSTRAINT [CPK_mhm_transporter_code] PRIMARY KEY CLUSTERED ([transporter_cd] ASC)
);


GO

