CREATE TABLE [dbo].[profile_type_desc] (
    [code]             VARCHAR (10)   NOT NULL,
    [type]             VARCHAR (5)    NOT NULL,
    [cs_ns]            VARCHAR (100)  NULL,
    [cs_ew]            VARCHAR (100)  NULL,
    [cs_quad]          VARCHAR (100)  NULL,
    [mapid]            VARCHAR (100)  NULL,
    [builders]         VARCHAR (100)  NULL,
    [opinion_of_value] VARCHAR (100)  NULL,
    [comment]          VARCHAR (1024) NULL,
    [inspection_date]  DATETIME       NULL,
    [appraisers]       VARCHAR (100)  NULL,
    [appraiser_id]     INT            NULL,
    [lKey]             INT            IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_profile_type_desc] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_code_type_appraiser_id]
    ON [dbo].[profile_type_desc]([code] ASC, [type] ASC, [appraiser_id] ASC) WITH (FILLFACTOR = 90);


GO

