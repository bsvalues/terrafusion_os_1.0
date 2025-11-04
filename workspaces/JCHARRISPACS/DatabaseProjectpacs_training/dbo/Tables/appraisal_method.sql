CREATE TABLE [dbo].[appraisal_method] (
    [appr_method_cd]  CHAR (5)     NOT NULL,
    [appr_desc]       VARCHAR (12) NOT NULL,
    [appr_desc_short] VARCHAR (5)  NOT NULL,
    CONSTRAINT [CPK_appraisal_method] PRIMARY KEY CLUSTERED ([appr_method_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains list of appraisal method codes and descriptions.  The data herein is defined by TA.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'appraisal_method';


GO

