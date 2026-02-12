CREATE TABLE [dbo].[abs_subdv_worksheet_prop_assoc] (
    [abs_subdv_cd]      VARCHAR (10)    NOT NULL,
    [prop_id]           INT             NOT NULL,
    [date_entered]      DATETIME        NULL,
    [geo_id]            VARCHAR (50)    NULL,
    [existing_acreage]  DECIMAL (14, 4) NULL,
    [deleted_acreage]   DECIMAL (14, 4) NULL,
    [remaining_acreage] DECIMAL (14, 4) NULL,
    [market_val]        NUMERIC (14)    NULL,
    CONSTRAINT [CPK_abs_subdv_worksheet_prop_assoc] PRIMARY KEY CLUSTERED ([abs_subdv_cd] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

