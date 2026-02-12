CREATE TABLE [dbo].[pp_rendition_penalty_report] (
    [prop_id]          INT             NOT NULL,
    [owner_id]         INT             NOT NULL,
    [rendition_year]   NUMERIC (4)     NOT NULL,
    [owner_name]       VARCHAR (70)    NULL,
    [legal_desc]       VARCHAR (255)   NULL,
    [situs_address]    VARCHAR (140)   NULL,
    [market_value]     NUMERIC (14)    NULL,
    [geo_id]           VARCHAR (50)    NULL,
    [ref_id1]          VARCHAR (50)    NULL,
    [ref_id2]          VARCHAR (50)    NULL,
    [current_penalty]  NUMERIC (14, 2) NULL,
    [previous_penalty] NUMERIC (14, 2) NULL
);


GO

