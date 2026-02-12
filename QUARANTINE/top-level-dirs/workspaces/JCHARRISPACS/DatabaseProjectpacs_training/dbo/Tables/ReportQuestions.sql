CREATE TABLE [dbo].[ReportQuestions] (
    [Report]     VARCHAR (20) NOT NULL,
    [QuestionID] VARCHAR (10) NOT NULL,
    [Type]       INT          NULL,
    [Page]       INT          NOT NULL,
    [XCoord1]    INT          NOT NULL,
    [YCoord1]    INT          NOT NULL,
    [XCoord2]    INT          NULL,
    [YCoord2]    INT          NULL,
    [BoxSize]    INT          NULL,
    CONSTRAINT [CPK_ReportQuestions] PRIMARY KEY CLUSTERED ([Report] ASC, [QuestionID] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_reportquestions_insert_ChangeLog
on reportquestions
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
 
declare @Report varchar(20)
declare @QuestionID varchar(10)
declare @Type int
declare @Page int
declare @XCoord1 int
declare @YCoord1 int
declare @XCoord2 int
declare @YCoord2 int
declare @BoxSize int
 
declare curRows cursor
for
     select Report, QuestionID, Type, Page, XCoord1, YCoord1, XCoord2, YCoord2, BoxSize from inserted
for read only
 
open curRows
fetch next from curRows into @Report, @QuestionID, @Type, @Page, @XCoord1, @YCoord1, @XCoord2, @YCoord2, @BoxSize
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Report/Question: ' + @report + '/' + @questionid
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'Report' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 4384, null, convert(varchar(255), @Report), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'QuestionID' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 4242, null, convert(varchar(255), @QuestionID), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'Type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 5396, null, convert(varchar(255), @Type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'Page' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 3532, null, convert(varchar(255), @Page), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'XCoord1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 5542, null, convert(varchar(255), @XCoord1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'YCoord1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 5548, null, convert(varchar(255), @YCoord1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'XCoord2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 5543, null, convert(varchar(255), @XCoord2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'YCoord2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 5549, null, convert(varchar(255), @YCoord2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reportquestions' and
               chg_log_columns = 'BoxSize' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 727, 553, null, convert(varchar(255), @BoxSize), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
     end
 
     fetch next from curRows into @Report, @QuestionID, @Type, @Page, @XCoord1, @YCoord1, @XCoord2, @YCoord2, @BoxSize
end
 
close curRows
deallocate curRows

GO



create trigger tr_reportquestions_delete_ChangeLog
on reportquestions
for delete
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
 
if not exists (
     select chg_log_audit
     from chg_log_columns with(nolock)
     where
          chg_log_tables = 'reportquestions' and
          chg_log_audit = 1
)
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
 
declare @Report varchar(20)
declare @QuestionID varchar(10)
 
declare curRows cursor
for
     select Report, QuestionID from deleted
for read only
 
open curRows
fetch next from curRows into @Report, @QuestionID
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Report/Question: ' + @report + '/' + @questionid
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 727, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @Report), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @QuestionID), 0)
 
     fetch next from curRows into @Report, @QuestionID
end
 
close curRows
deallocate curRows

GO



create trigger tr_reportquestions_update_ChangeLog
on reportquestions
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
 
declare @old_Report varchar(20)
declare @new_Report varchar(20)
declare @old_QuestionID varchar(10)
declare @new_QuestionID varchar(10)
declare @old_Type int
declare @new_Type int
declare @old_Page int
declare @new_Page int
declare @old_XCoord1 int
declare @new_XCoord1 int
declare @old_YCoord1 int
declare @new_YCoord1 int
declare @old_XCoord2 int
declare @new_XCoord2 int
declare @old_YCoord2 int
declare @new_YCoord2 int
declare @old_BoxSize int
declare @new_BoxSize int
 
declare curRows cursor
for
     select d.Report, d.QuestionID, d.Type, d.Page, d.XCoord1, d.YCoord1, d.XCoord2, d.YCoord2, d.BoxSize, i.Report, i.QuestionID, i.Type, i.Page, i.XCoord1, i.YCoord1, i.XCoord2, i.YCoord2, i.BoxSize
from deleted as d
join inserted as i on 
     d.Report = i.Report and
     d.QuestionID = i.QuestionID
for read only
 
open curRows
fetch next from curRows into @old_Report, @old_QuestionID, @old_Type, @old_Page, @old_XCoord1, @old_YCoord1, @old_XCoord2, @old_YCoord2, @old_BoxSize, @new_Report, @new_QuestionID, @new_Type, @new_Page, @new_XCoord1, @new_YCoord1, @new_XCoord2, @new_YCoord2, @new_BoxSize
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Report/Question: ' + @new_report + '/' + @new_questionid
 
     if (
          @old_Report <> @new_Report
          or
          ( @old_Report is null and @new_Report is not null ) 
          or
          ( @old_Report is not null and @new_Report is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'Report' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 4384, convert(varchar(255), @old_Report), convert(varchar(255), @new_Report), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_QuestionID <> @new_QuestionID
          or
          ( @old_QuestionID is null and @new_QuestionID is not null ) 
          or
          ( @old_QuestionID is not null and @new_QuestionID is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'QuestionID' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 4242, convert(varchar(255), @old_QuestionID), convert(varchar(255), @new_QuestionID), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_Type <> @new_Type
          or
          ( @old_Type is null and @new_Type is not null ) 
          or
          ( @old_Type is not null and @new_Type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'Type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 5396, convert(varchar(255), @old_Type), convert(varchar(255), @new_Type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_Page <> @new_Page
          or
          ( @old_Page is null and @new_Page is not null ) 
          or
          ( @old_Page is not null and @new_Page is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'Page' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 3532, convert(varchar(255), @old_Page), convert(varchar(255), @new_Page), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_XCoord1 <> @new_XCoord1
          or
          ( @old_XCoord1 is null and @new_XCoord1 is not null ) 
          or
          ( @old_XCoord1 is not null and @new_XCoord1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'XCoord1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 5542, convert(varchar(255), @old_XCoord1), convert(varchar(255), @new_XCoord1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_YCoord1 <> @new_YCoord1
          or
          ( @old_YCoord1 is null and @new_YCoord1 is not null ) 
          or
          ( @old_YCoord1 is not null and @new_YCoord1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'YCoord1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 5548, convert(varchar(255), @old_YCoord1), convert(varchar(255), @new_YCoord1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_XCoord2 <> @new_XCoord2
          or
          ( @old_XCoord2 is null and @new_XCoord2 is not null ) 
          or
          ( @old_XCoord2 is not null and @new_XCoord2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'XCoord2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 5543, convert(varchar(255), @old_XCoord2), convert(varchar(255), @new_XCoord2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_YCoord2 <> @new_YCoord2
          or
          ( @old_YCoord2 is null and @new_YCoord2 is not null ) 
          or
          ( @old_YCoord2 is not null and @new_YCoord2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'YCoord2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 5549, convert(varchar(255), @old_YCoord2), convert(varchar(255), @new_YCoord2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     if (
          @old_BoxSize <> @new_BoxSize
          or
          ( @old_BoxSize is null and @new_BoxSize is not null ) 
          or
          ( @old_BoxSize is not null and @new_BoxSize is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reportquestions' and
                    chg_log_columns = 'BoxSize' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 727, 553, convert(varchar(255), @old_BoxSize), convert(varchar(255), @new_BoxSize), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4384, convert(varchar(24), @new_Report), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4242, convert(varchar(24), @new_QuestionID), 0)
          end
     end
 
     fetch next from curRows into @old_Report, @old_QuestionID, @old_Type, @old_Page, @old_XCoord1, @old_YCoord1, @old_XCoord2, @old_YCoord2, @old_BoxSize, @new_Report, @new_QuestionID, @new_Type, @new_Page, @new_XCoord1, @new_YCoord1, @new_XCoord2, @new_YCoord2, @new_BoxSize
end
 
close curRows
deallocate curRows

GO

