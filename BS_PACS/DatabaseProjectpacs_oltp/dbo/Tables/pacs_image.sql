CREATE TABLE [dbo].[pacs_image] (
    [image_id]           INT           NOT NULL,
    [image_type]         CHAR (10)     NOT NULL,
    [location]           VARCHAR (255) NULL,
    [image_nm]           VARCHAR (64)  NULL,
    [scan_dt]            DATETIME      NULL,
    [expiration_dt]      DATETIME      NULL,
    [sub_type]           CHAR (10)     NOT NULL,
    [rec_type]           CHAR (10)     NOT NULL,
    [eff_yr]             DECIMAL (4)   NULL,
    [status_cd]          CHAR (5)      NULL,
    [status_dt]          DATETIME      NULL,
    [comment]            VARCHAR (255) NULL,
    [image_dt]           DATETIME      NULL,
    [chg_reason]         VARCHAR (255) NULL,
    [pacs_user_id]       INT           NULL,
    [status_user_id]     INT           NULL,
    [ref_id]             INT           CONSTRAINT [CDF_pacs_image_ref_id] DEFAULT (0) NOT NULL,
    [ref_type]           VARCHAR (5)   CONSTRAINT [CDF_pacs_image_ref_type] DEFAULT ('P') NOT NULL,
    [ref_year]           NUMERIC (4)   CONSTRAINT [CDF_pacs_image_ref_year] DEFAULT (0) NOT NULL,
    [expiry_dt_override] CHAR (1)      NULL,
    [role_attribute_id]  INT           NULL,
    [ref_id1]            INT           NULL,
    [ref_id2]            INT           NULL,
    [ref_id3]            INT           NULL,
    [notify]             BIT           CONSTRAINT [CDF_pacs_image_notify] DEFAULT ((0)) NULL,
    [main]               BIT           NULL,
    [alternate_id]       VARCHAR (50)  NULL,
    [assessment_id]      VARCHAR (50)  NULL,
    [bulk_import_type]   VARCHAR (50)  NULL,
    [bulk_import_id]     NUMERIC (18)  CONSTRAINT [CDF_pacs_image_bulk_import_id] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_pacs_image] PRIMARY KEY CLUSTERED ([image_id] ASC, [ref_id] ASC, [ref_type] ASC),
    CONSTRAINT [FK_pacs_image_image_type] FOREIGN KEY ([image_type]) REFERENCES [dbo].[image_type] ([image_type]),
    CONSTRAINT [FK_pacs_image_rec_type] FOREIGN KEY ([image_type], [rec_type]) REFERENCES [dbo].[rect_type] ([image_type], [rect_type]),
    CONSTRAINT [FK_pacs_image_sub_type] FOREIGN KEY ([image_type], [rec_type], [sub_type]) REFERENCES [dbo].[sub_type] ([image_type], [rect_type], [sub_type])
);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id_ref_type_ref_year]
    ON [dbo].[pacs_image]([ref_id] ASC, [ref_type] ASC, [ref_year] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id3]
    ON [dbo].[pacs_image]([ref_id3] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id1]
    ON [dbo].[pacs_image]([ref_id1] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id2]
    ON [dbo].[pacs_image]([ref_id2] ASC) WITH (FILLFACTOR = 90);


GO

 
create trigger tr_pacs_image_update_ChangeLog
on pacs_image
for update
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @old_image_id int
declare @new_image_id int
declare @old_image_type char(10)
declare @new_image_type char(10)
declare @old_location varchar(255)
declare @new_location varchar(255)
declare @old_image_nm varchar(64)
declare @new_image_nm varchar(64)
declare @old_scan_dt datetime
declare @new_scan_dt datetime
declare @old_expiration_dt datetime
declare @new_expiration_dt datetime
declare @old_sub_type char(10)
declare @new_sub_type char(10)
declare @old_rec_type char(10)
declare @new_rec_type char(10)
declare @old_eff_yr decimal(4,0)
declare @new_eff_yr decimal(4,0)
declare @old_status_cd char(5)
declare @new_status_cd char(5)
declare @old_status_dt datetime
declare @new_status_dt datetime
declare @old_comment varchar(255)
declare @new_comment varchar(255)
declare @old_image_dt datetime
declare @new_image_dt datetime
declare @old_chg_reason varchar(255)
declare @new_chg_reason varchar(255)
declare @old_pacs_user_id int
declare @new_pacs_user_id int
declare @old_status_user_id int
declare @new_status_user_id int
declare @old_ref_id int
declare @new_ref_id int
declare @old_ref_type varchar(5)
declare @new_ref_type varchar(5)
declare @old_ref_year numeric(4,0)
declare @new_ref_year numeric(4,0)
declare @old_expiry_dt_override char(1)
declare @new_expiry_dt_override char(1)
declare @old_role_attribute_id int
declare @new_role_attribute_id int
 
declare curRows cursor
for
     select d.image_id, d.image_type, d.location, d.image_nm, d.scan_dt, d.expiration_dt, d.sub_type, d.rec_type, d.eff_yr, d.status_cd, d.status_dt, d.comment, d.image_dt, d.chg_reason, d.pacs_user_id, d.status_user_id, d.ref_id, d.ref_type, d.ref_year, d.expiry_dt_override, d.role_attribute_id, 
            i.image_id, i.image_type, i.location, i.image_nm, i.scan_dt, i.expiration_dt, i.sub_type, i.rec_type, i.eff_yr, i.status_cd, i.status_dt, i.comment, i.image_dt, i.chg_reason, i.pacs_user_id, i.status_user_id, i.ref_id, i.ref_type, i.ref_year, i.expiry_dt_override, i.role_attribute_id
from deleted as d
join inserted as i on 
     d.image_id = i.image_id and
     d.ref_id = i.ref_id and
     d.ref_type = i.ref_type
for read only
 
open curRows
fetch next from curRows into @old_image_id, @old_image_type, @old_location, @old_image_nm, @old_scan_dt, @old_expiration_dt, @old_sub_type, @old_rec_type, @old_eff_yr, @old_status_cd, @old_status_dt, @old_comment, @old_image_dt, @old_chg_reason, @old_pacs_user_id, @old_status_user_id, @old_ref_id, @old_ref_type, @old_ref_year, @old_expiry_dt_override, @old_role_attribute_id, 
                             @new_image_id, @new_image_type, @new_location, @new_image_nm, @new_scan_dt, @new_expiration_dt, @new_sub_type, @new_rec_type, @new_eff_yr, @new_status_cd, @new_status_dt, @new_comment, @new_image_dt, @new_chg_reason, @new_pacs_user_id, @new_status_user_id, @new_ref_id, @new_ref_type, @new_ref_year, @new_expiry_dt_override, @new_role_attribute_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_image_id <> @new_image_id
          or
          ( @old_image_id is null and @new_image_id is not null ) 
          or
          ( @old_image_id is not null and @new_image_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'image_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 2157, convert(varchar(255), @old_image_id), convert(varchar(255), @new_image_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_image_type <> @new_image_type
          or
          ( @old_image_type is null and @new_image_type is not null ) 
          or
          ( @old_image_type is not null and @new_image_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'image_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 2160, convert(varchar(255), @old_image_type), convert(varchar(255), @new_image_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_location <> @new_location
          or
          ( @old_location is null and @new_location is not null ) 
          or
          ( @old_location is not null and @new_location is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'location' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 2903, convert(varchar(255), @old_location), convert(varchar(255), @new_location), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_image_nm <> @new_image_nm
          or
          ( @old_image_nm is null and @new_image_nm is not null ) 
          or
          ( @old_image_nm is not null and @new_image_nm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'image_nm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 2158, convert(varchar(255), @old_image_nm), convert(varchar(255), @new_image_nm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_scan_dt <> @new_scan_dt
          or
          ( @old_scan_dt is null and @new_scan_dt is not null ) 
          or
          ( @old_scan_dt is not null and @new_scan_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'scan_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4613, convert(varchar(255), @old_scan_dt), convert(varchar(255), @new_scan_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_expiration_dt <> @new_expiration_dt
          or
          ( @old_expiration_dt is null and @new_expiration_dt is not null ) 
          or
          ( @old_expiration_dt is not null and @new_expiration_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'expiration_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 1842, convert(varchar(255), @old_expiration_dt), convert(varchar(255), @new_expiration_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_sub_type <> @new_sub_type
          or
          ( @old_sub_type is null and @new_sub_type is not null ) 
          or
          ( @old_sub_type is not null and @new_sub_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'sub_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4969, convert(varchar(255), @old_sub_type), convert(varchar(255), @new_sub_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_rec_type <> @new_rec_type
          or
          ( @old_rec_type is null and @new_rec_type is not null ) 
          or
          ( @old_rec_type is not null and @new_rec_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'rec_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4312, convert(varchar(255), @old_rec_type), convert(varchar(255), @new_rec_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_eff_yr <> @new_eff_yr
          or
          ( @old_eff_yr is null and @new_eff_yr is not null ) 
          or
          ( @old_eff_yr is not null and @new_eff_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'eff_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 1423, convert(varchar(255), @old_eff_yr), convert(varchar(255), @new_eff_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_status_cd <> @new_status_cd
          or
          ( @old_status_cd is null and @new_status_cd is not null ) 
          or
          ( @old_status_cd is not null and @new_status_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'status_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4948, convert(varchar(255), @old_status_cd), convert(varchar(255), @new_status_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_status_dt <> @new_status_dt
          or
          ( @old_status_dt is null and @new_status_dt is not null ) 
          or
          ( @old_status_dt is not null and @new_status_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'status_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4952, convert(varchar(255), @old_status_dt), convert(varchar(255), @new_status_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_comment <> @new_comment
          or
          ( @old_comment is null and @new_comment is not null ) 
          or
          ( @old_comment is not null and @new_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 827, convert(varchar(255), @old_comment), convert(varchar(255), @new_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_image_dt <> @new_image_dt
          or
          ( @old_image_dt is null and @new_image_dt is not null ) 
          or
          ( @old_image_dt is not null and @new_image_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'image_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 2156, convert(varchar(255), @old_image_dt), convert(varchar(255), @new_image_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_chg_reason <> @new_chg_reason
          or
          ( @old_chg_reason is null and @new_chg_reason is not null ) 
          or
          ( @old_chg_reason is not null and @new_chg_reason is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'chg_reason' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 741, convert(varchar(255), @old_chg_reason), convert(varchar(255), @new_chg_reason), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_pacs_user_id <> @new_pacs_user_id
          or
          ( @old_pacs_user_id is null and @new_pacs_user_id is not null ) 
          or
          ( @old_pacs_user_id is not null and @new_pacs_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'pacs_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 3525, convert(varchar(255), @old_pacs_user_id), convert(varchar(255), @new_pacs_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_status_user_id <> @new_status_user_id
          or
          ( @old_status_user_id is null and @new_status_user_id is not null ) 
          or
          ( @old_status_user_id is not null and @new_status_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'status_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4953, convert(varchar(255), @old_status_user_id), convert(varchar(255), @new_status_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_ref_id <> @new_ref_id
          or
          ( @old_ref_id is null and @new_ref_id is not null ) 
          or
          ( @old_ref_id is not null and @new_ref_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'ref_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4326, convert(varchar(255), @old_ref_id), convert(varchar(255), @new_ref_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_ref_type <> @new_ref_type
          or
          ( @old_ref_type is null and @new_ref_type is not null ) 
          or
          ( @old_ref_type is not null and @new_ref_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'ref_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4334, convert(varchar(255), @old_ref_type), convert(varchar(255), @new_ref_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_ref_year <> @new_ref_year
          or
          ( @old_ref_year is null and @new_ref_year is not null ) 
          or
          ( @old_ref_year is not null and @new_ref_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'ref_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 4335, convert(varchar(255), @old_ref_year), convert(varchar(255), @new_ref_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_expiry_dt_override <> @new_expiry_dt_override
          or
          ( @old_expiry_dt_override is null and @new_expiry_dt_override is not null ) 
          or
          ( @old_expiry_dt_override is not null and @new_expiry_dt_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'expiry_dt_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 5940, convert(varchar(255), @old_expiry_dt_override), convert(varchar(255), @new_expiry_dt_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     if (
          @old_role_attribute_id <> @new_role_attribute_id
          or
          ( @old_role_attribute_id is null and @new_role_attribute_id is not null ) 
          or
          ( @old_role_attribute_id is not null and @new_role_attribute_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_image' and
                    chg_log_columns = 'role_attribute_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 551, 9530, convert(varchar(255), @old_role_attribute_id), convert(varchar(255), @new_role_attribute_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @new_image_id), @new_image_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @new_ref_id), @new_ref_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @new_ref_type), 0)
          end
     end
 
     fetch next from curRows into @old_image_id, @old_image_type, @old_location, @old_image_nm, @old_scan_dt, @old_expiration_dt, @old_sub_type, @old_rec_type, @old_eff_yr, @old_status_cd, @old_status_dt, @old_comment, @old_image_dt, @old_chg_reason, @old_pacs_user_id, @old_status_user_id, @old_ref_id, @old_ref_type, @old_ref_year, @old_expiry_dt_override, @old_role_attribute_id, 
                                  @new_image_id, @new_image_type, @new_location, @new_image_nm, @new_scan_dt, @new_expiration_dt, @new_sub_type, @new_rec_type, @new_eff_yr, @new_status_cd, @new_status_dt, @new_comment, @new_image_dt, @new_chg_reason, @new_pacs_user_id, @new_status_user_id, @new_ref_id, @new_ref_type, @new_ref_year, @new_expiry_dt_override, @new_role_attribute_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_pacs_image_insert_ChangeLog
on pacs_image
for insert
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @image_id int
declare @image_type char(10)
declare @location varchar(255)
declare @image_nm varchar(64)
declare @scan_dt datetime
declare @expiration_dt datetime
declare @sub_type char(10)
declare @rec_type char(10)
declare @eff_yr decimal(4,0)
declare @status_cd char(5)
declare @status_dt datetime
declare @comment varchar(255)
declare @image_dt datetime
declare @chg_reason varchar(255)
declare @pacs_user_id int
declare @status_user_id int
declare @ref_id int
declare @ref_type varchar(5)
declare @ref_year numeric(4,0)
declare @expiry_dt_override char(1)
declare @role_attribute_id int
 
declare curRows cursor
for
     select image_id, image_type, location, image_nm, scan_dt, expiration_dt, sub_type, rec_type, eff_yr, status_cd, status_dt, comment, image_dt, chg_reason, pacs_user_id, status_user_id, ref_id, ref_type, ref_year, expiry_dt_override, role_attribute_id from inserted
for read only
 
open curRows
fetch next from curRows into @image_id, @image_type, @location, @image_nm, @scan_dt, @expiration_dt, @sub_type, @rec_type, @eff_yr, @status_cd, @status_dt, @comment, @image_dt, @chg_reason, @pacs_user_id, @status_user_id, @ref_id, @ref_type, @ref_year, @expiry_dt_override, @role_attribute_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'image_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 2157, null, convert(varchar(255), @image_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'image_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 2160, null, convert(varchar(255), @image_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'location' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 2903, null, convert(varchar(255), @location), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'image_nm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 2158, null, convert(varchar(255), @image_nm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'scan_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4613, null, convert(varchar(255), @scan_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'expiration_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 1842, null, convert(varchar(255), @expiration_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'sub_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4969, null, convert(varchar(255), @sub_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'rec_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4312, null, convert(varchar(255), @rec_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'eff_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 1423, null, convert(varchar(255), @eff_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'status_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4948, null, convert(varchar(255), @status_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'status_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4952, null, convert(varchar(255), @status_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 827, null, convert(varchar(255), @comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'image_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 2156, null, convert(varchar(255), @image_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'chg_reason' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 741, null, convert(varchar(255), @chg_reason), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'pacs_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 3525, null, convert(varchar(255), @pacs_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'status_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4953, null, convert(varchar(255), @status_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'ref_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4326, null, convert(varchar(255), @ref_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'ref_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4334, null, convert(varchar(255), @ref_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'ref_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 4335, null, convert(varchar(255), @ref_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'expiry_dt_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 5940, null, convert(varchar(255), @expiry_dt_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_image' and
               chg_log_columns = 'role_attribute_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 551, 9530, null, convert(varchar(255), @role_attribute_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2157, convert(varchar(24), @image_id), @image_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4326, convert(varchar(24), @ref_id), @ref_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4334, convert(varchar(24), @ref_type), 0)
     end
 
     fetch next from curRows into @image_id, @image_type, @location, @image_nm, @scan_dt, @expiration_dt, @sub_type, @rec_type, @eff_yr, @status_cd, @status_dt, @comment, @image_dt, @chg_reason, @pacs_user_id, @status_user_id, @ref_id, @ref_type, @ref_year, @expiry_dt_override, @role_attribute_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag that indicates that an image is the main image on a property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_image', @level2type = N'COLUMN', @level2name = N'main';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'bulk_import_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_image', @level2type = N'COLUMN', @level2name = N'bulk_import_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'alternate_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_image', @level2type = N'COLUMN', @level2name = N'alternate_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'assessment_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_image', @level2type = N'COLUMN', @level2name = N'assessment_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Will notify linked properties if present', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_image', @level2type = N'COLUMN', @level2name = N'notify';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'bulk_import_type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pacs_image', @level2type = N'COLUMN', @level2name = N'bulk_import_type';


GO

