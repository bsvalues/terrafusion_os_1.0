CREATE TABLE [dbo].[import_bpp_rendition] (
    [run_id]                        INT           NOT NULL,
    [rid]                           INT           IDENTITY (1, 1) NOT NULL,
    [prop_id]                       INT           NOT NULL,
    [rendition_date]                DATETIME      NULL,
    [filing_status]                 VARCHAR (25)  NULL,
    [appraiser_id]                  INT           NULL,
    [rendition_comment]             VARCHAR (255) NULL,
    [ubi]                           VARCHAR (50)  NULL,
    [hof_exemption]                 BIT           DEFAULT ((0)) NOT NULL,
    [naics_code]                    VARCHAR (10)  NULL,
    [segment_number]                INT           NULL,
    [segment_type]                  VARCHAR (10)  NULL,
    [segment_description]           VARCHAR (255) NULL,
    [segment_year_acquired]         NUMERIC (4)   NULL,
    [segment_original_cost]         NUMERIC (14)  NULL,
    [segment_valuation_method]      VARCHAR (4)   NULL,
    [segment_state_code]            VARCHAR (5)   NULL,
    [segment_farm_asset_flag]       BIT           DEFAULT ((0)) NOT NULL,
    [segment_make]                  VARCHAR (10)  NULL,
    [segment_model]                 VARCHAR (10)  NULL,
    [segment_vin]                   VARCHAR (30)  NULL,
    [segment_license_number]        VARCHAR (10)  NULL,
    [sub_segment_type]              VARCHAR (10)  NULL,
    [sub_segment_description]       VARCHAR (255) NULL,
    [sub_segment_year_acquired]     NUMERIC (4)   NULL,
    [sub_segment_orig_cost]         NUMERIC (14)  NULL,
    [sub_segment_valuation_method]  VARCHAR (4)   NULL,
    [sub_segment_depreciation_type] VARCHAR (10)  NULL,
    [sub_segment_depreciation_code] VARCHAR (10)  NULL,
    [sub_segment_naics_code]        VARCHAR (10)  NULL,
    [sub_segment_asset_id]          VARCHAR (50)  NULL,
    CONSTRAINT [CPK_import_bpp_rendition] PRIMARY KEY CLUSTERED ([run_id] ASC, [rid] ASC),
    CONSTRAINT [CFK_import_bpp_rendition_import_bpp] FOREIGN KEY ([run_id]) REFERENCES [dbo].[import_bpp] ([run_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Original Cost', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_original_cost';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property NAICS Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'naics_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment Year Acquired', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_year_acquired';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment NAICS Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_naics_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Model', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_model';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import BPP Rendition table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Filing Status', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'filing_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Rendition Date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'rendition_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'HOF Exemption Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'hof_exemption';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Year Acquired', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_year_acquired';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Make', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_make';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment Depreciation Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_depreciation_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Rendition Record ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'rid';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Rendition Comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'rendition_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Type Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment State Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_state_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment License #', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_license_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'UBI Number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'ubi';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Farm Asset Indicator (0 = false, 1 = true)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_farm_asset_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment Depreciation Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_depreciation_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Appraiser ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'appraiser_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment VIN', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_vin';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub-segment Asset ID value from import file', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_asset_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment Original Cost', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_orig_cost';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Segment Valuation Method', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'segment_valuation_method';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Sub Segment Valuation Method', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_rendition', @level2type = N'COLUMN', @level2name = N'sub_segment_valuation_method';


GO

