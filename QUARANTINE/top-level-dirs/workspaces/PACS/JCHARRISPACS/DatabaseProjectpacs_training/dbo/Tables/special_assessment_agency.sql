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
    CONSTRAINT [CPK_special_assessment_agency] PRIMARY KEY CLUSTERED ([agency_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_special_assessment_agency_agency_id] FOREIGN KEY ([agency_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_special_assessment_agency_assessment_type_cd] FOREIGN KEY ([assessment_type_cd]) REFERENCES [dbo].[assessment_type] ([assessment_type_cd]),
    CONSTRAINT [CFK_special_assessment_agency_fin_vendor_id] FOREIGN KEY ([fin_vendor_id]) REFERENCES [dbo].[fin_vendor] ([fin_vendor_id]),
    CONSTRAINT [CFK_special_assessment_agency_fin_vendor_site_id] FOREIGN KEY ([fin_vendor_site_id]) REFERENCES [dbo].[fin_vendor_site] ([fin_vendor_site_id]),
    CONSTRAINT [CUQ_special_assessment_agency_assessment_cd] UNIQUE NONCLUSTERED ([assessment_cd] ASC)
);


GO

create trigger [dbo].[tr_special_assessment_agency_delete_insert_update_MemTable]
on special_assessment_agency
for delete, insert, update
not for replication
as
begin

	if ( @@rowcount = 0 )
	 return
 
	set nocount on
 
	update table_cache_status with(rowlock)
	set lDummy = 0
	where szTableName = 'special_assessment_agency'

end

GO

