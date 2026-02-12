CREATE TABLE [dbo].[ncoa_import_details] (
    [run_id]       INT          NOT NULL,
    [record_id]    INT          NOT NULL,
    [owner_id]     INT          NOT NULL,
    [year]         NUMERIC (4)  NOT NULL,
    [file_as_name] VARCHAR (70) NOT NULL,
    [addr_type_cd] CHAR (5)     NOT NULL,
    [addr_line_1]  VARCHAR (60) NULL,
    [addr_line_2]  VARCHAR (60) NULL,
    [addr_line_3]  VARCHAR (60) NULL,
    [addr_city]    VARCHAR (50) NULL,
    [addr_state]   VARCHAR (50) NULL,
    [zip]          VARCHAR (10) NULL,
    [cass]         VARCHAR (4)  NULL,
    [route]        VARCHAR (2)  NULL,
    [new_zip]      VARCHAR (5)  NULL,
    [new_cass]     VARCHAR (4)  NULL,
    [new_route]    VARCHAR (2)  NULL,
    [invalid_flag] BIT          CONSTRAINT [CDF_ncoa_import_details_invalid_flag] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [pk_NCOAImportDetails] PRIMARY KEY CLUSTERED ([run_id] ASC, [record_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates whehter the record is invalid or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ncoa_import_details', @level2type = N'COLUMN', @level2name = N'invalid_flag';


GO

