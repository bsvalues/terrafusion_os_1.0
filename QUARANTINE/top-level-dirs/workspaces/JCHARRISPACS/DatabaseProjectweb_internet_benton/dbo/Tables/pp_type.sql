CREATE TABLE [dbo].[pp_type] (
    [pp_type_cd]            CHAR (10)    NOT NULL,
    [pp_type_desc]          VARCHAR (50) NOT NULL,
    [vit_flag]              CHAR (1)     NULL,
    [sys_flag]              CHAR (1)     NULL,
    [asset_listing_type_cd] CHAR (1)     NULL,
    [classification]        VARCHAR (5)  NULL,
    [abstract_type]         VARCHAR (10) NULL,
    CONSTRAINT [CPK_pp_type] PRIMARY KEY CLUSTERED ([pp_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

