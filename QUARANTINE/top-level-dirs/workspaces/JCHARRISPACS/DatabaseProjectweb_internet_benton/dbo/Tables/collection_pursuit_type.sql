CREATE TABLE [dbo].[collection_pursuit_type] (
    [pursuit_type_code]             VARCHAR (10) NOT NULL,
    [pursuit_type_description]      VARCHAR (50) NOT NULL,
    [pursuit_category_code]         VARCHAR (10) NOT NULL,
    [exclude_deferral_properties]   BIT          NOT NULL,
    [exclude_bankruptcy_properties] BIT          NOT NULL,
    CONSTRAINT [CPK_collection_pursuit_type] PRIMARY KEY CLUSTERED ([pursuit_type_code] ASC)
);


GO

