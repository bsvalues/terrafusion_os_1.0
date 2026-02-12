CREATE TABLE [dbo].[special_assessment_agency] (
    [agency_id]              INT          NOT NULL,
    [assessment_cd]          VARCHAR (50) NOT NULL,
    [assessment_type_cd]     VARCHAR (50) NOT NULL,
    [assessment_description] VARCHAR (50) NULL,
    [resolution_num]         VARCHAR (50) NULL,
    [resolution_date]        DATETIME     NULL,
    [start_date]             DATETIME     NULL,
    [end_date]               DATETIME     NULL,
    [fin_vendor_id]          INT          NULL,
    [fin_vendor_site_id]     INT          NULL,
    CONSTRAINT [CPK_special_assessment_agency] PRIMARY KEY CLUSTERED ([agency_id] ASC) WITH (FILLFACTOR = 100)
);


GO

