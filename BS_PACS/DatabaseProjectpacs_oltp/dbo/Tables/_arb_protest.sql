CREATE TABLE [dbo].[_arb_protest] (
    [prop_id]                              INT            NOT NULL,
    [prop_val_yr]                          NUMERIC (4)    NOT NULL,
    [case_id]                              INT            NOT NULL,
    [prot_create_dt]                       DATETIME       NULL,
    [prot_complete_dt]                     DATETIME       NULL,
    [prot_type]                            VARCHAR (10)   NULL,
    [prot_status]                          VARCHAR (10)   NULL,
    [prot_taxpayer_doc_requested]          CHAR (1)       NULL,
    [prot_taxpayer_doc_recorded_dt]        DATETIME       NULL,
    [prot_taxpayer_evidence_requested]     CHAR (1)       NULL,
    [prot_taxpayer_evidence_requested_dt]  DATETIME       NULL,
    [prot_taxpayer_evidence_delivered_dt]  DATETIME       NULL,
    [prot_taxpayer_evidence_staff]         INT            NULL,
    [prot_taxpayer_additional_evidence]    CHAR (1)       NULL,
    [prot_taxpayer_evidence_waiver]        CHAR (1)       NULL,
    [prot_taxes_paid]                      CHAR (1)       NULL,
    [prot_taxes_paid_verified_staff_id]    INT            NULL,
    [prot_taxes_paid_verified_dt]          DATETIME       NULL,
    [prot_appraisal_staff]                 INT            NULL,
    [prot_comments]                        VARCHAR (1024) NULL,
    [prot_affidavit_testimony_dt]          DATETIME       NULL,
    [prot_affidavit_testimony_by]          VARCHAR (10)   NULL,
    [prot_affidavit_testimony_received]    VARCHAR (10)   NULL,
    [docket_id]                            INT            NULL,
    [prot_assigned_panel]                  VARCHAR (10)   NULL,
    [prot_arrived_dt]                      DATETIME       NULL,
    [prot_hearing_rescheduled]             CHAR (1)       NULL,
    [prot_packet_printed_dt]               DATETIME       NULL,
    [prot_full_board_hearing]              CHAR (1)       NULL,
    [prot_hearing_appraisal_staff]         INT            NULL,
    [prot_hearing_start_dt]                DATETIME       NULL,
    [prot_hearing_finished_dt]             DATETIME       NULL,
    [prot_hearing_recorder_id]             INT            NULL,
    [prot_taxpayer_comments]               VARCHAR (1024) NULL,
    [prot_district_comments]               VARCHAR (1024) NULL,
    [prot_first_motion]                    VARCHAR (500)  NULL,
    [prot_sustain_district_val]            CHAR (1)       NULL,
    [prot_first_motion_by]                 VARCHAR (10)   NULL,
    [prot_first_motion_seconded_by]        VARCHAR (10)   NULL,
    [prot_first_motion_pass]               CHAR (1)       NULL,
    [prot_first_motion_decision_cd]        VARCHAR (10)   NULL,
    [prot_first_motion_decision_dt]        DATETIME       NULL,
    [prot_appraiser_assigned_val]          NUMERIC (14)   NULL,
    [prot_arb_assigned_val]                NUMERIC (14)   NULL,
    [prot_val_type]                        CHAR (1)       NULL,
    [prot_arb_instructions]                VARCHAR (500)  NULL,
    [prot_second_motion]                   VARCHAR (500)  NULL,
    [prot_second_motion_by]                VARCHAR (10)   NULL,
    [prot_second_motion_seconded_by]       VARCHAR (10)   NULL,
    [prot_second_motion_pass]              CHAR (1)       NULL,
    [prot_second_motion_decision_cd]       VARCHAR (10)   NULL,
    [prot_second_motion_decision_dt]       DATETIME       NULL,
    [prot_other_motion]                    VARCHAR (500)  NULL,
    [prot_full_ratification_dt]            DATETIME       NULL,
    [begin_land_hstd_val]                  NUMERIC (14)   NULL,
    [begin_land_non_hstd_val]              NUMERIC (14)   NULL,
    [begin_imprv_hstd_val]                 NUMERIC (14)   NULL,
    [begin_imprv_non_hstd_val]             NUMERIC (14)   NULL,
    [begin_ag_use_val]                     NUMERIC (14)   NULL,
    [begin_ag_market]                      NUMERIC (14)   NULL,
    [begin_timber_use]                     NUMERIC (14)   NULL,
    [begin_timber_market]                  NUMERIC (14)   NULL,
    [begin_market]                         NUMERIC (14)   NULL,
    [begin_appraised_val]                  NUMERIC (14)   NULL,
    [begin_ten_percent_cap]                NUMERIC (14)   NULL,
    [begin_assessed_val]                   NUMERIC (14)   NULL,
    [begin_rendered_val]                   NUMERIC (14)   NULL,
    [begin_exemptions]                     VARCHAR (50)   NULL,
    [begin_entities]                       VARCHAR (50)   NULL,
    [begin_recalc_dt]                      DATETIME       NULL,
    [final_land_hstd_val]                  NUMERIC (14)   NULL,
    [final_land_non_hstd_val]              NUMERIC (14)   NULL,
    [final_imprv_hstd_val]                 NUMERIC (14)   NULL,
    [final_imprv_non_hstd_val]             NUMERIC (14)   NULL,
    [final_ag_use_val]                     NUMERIC (14)   NULL,
    [final_ag_market]                      NUMERIC (14)   NULL,
    [final_timber_use]                     NUMERIC (14)   NULL,
    [final_timber_market]                  NUMERIC (14)   NULL,
    [final_market]                         NUMERIC (14)   NULL,
    [final_appraised_val]                  NUMERIC (14)   NULL,
    [final_ten_percent_cap]                NUMERIC (14)   NULL,
    [final_assessed_val]                   NUMERIC (14)   NULL,
    [final_rendered_val]                   NUMERIC (14)   NULL,
    [final_exemptions]                     VARCHAR (50)   NULL,
    [final_entities]                       VARCHAR (50)   NULL,
    [final_recalc_dt]                      DATETIME       NULL,
    [bGridComplete]                        BIT            CONSTRAINT [CDF__arb_protest_bGridComplete] DEFAULT (0) NOT NULL,
    [closed_pacs_user_id]                  INT            NULL,
    [bGenerateCompGrid]                    BIT            CONSTRAINT [CDF__arb_protest_bGenerateCompGrid] DEFAULT (1) NOT NULL,
    [status_date_changed]                  DATETIME       NULL,
    [status_changed_user_id]               INT            NULL,
    [associated_inquiry]                   INT            NULL,
    [appraiser_meeting_id]                 INT            NULL,
    [appraiser_meeting_appraiser_id]       INT            NULL,
    [appraiser_meeting_date_time]          DATETIME       NULL,
    [appraiser_meeting_appraiser_comments] VARCHAR (1024) NULL,
    [appraiser_meeting_taxpayer_comments]  VARCHAR (1024) NULL,
    [prot_appr_meeting_arrived_dt]         DATETIME       NULL,
    [prot_appr_docket_id]                  INT            NULL,
    [case_prepared]                        BIT            NOT NULL,
    [opinion_of_value]                     NUMERIC (14)   NULL,
    [decision_reason_cd]                   VARCHAR (10)   NULL,
    [prot_appraiser_assigned_land_val]     NUMERIC (14)   CONSTRAINT [CDF__arb_protest_prot_appraiser_assigned_land_val] DEFAULT ((0)) NULL,
    [prot_appraiser_assigned_imprv_val]    NUMERIC (14)   CONSTRAINT [CDF__arb_protest_prot_appraiser_assigned_imprv_val] DEFAULT ((0)) NULL,
    [prot_boe_assigned_land_val]           NUMERIC (14)   CONSTRAINT [CDF__arb_protest_prot_boe_assigned_land_val] DEFAULT ((0)) NULL,
    [prot_boe_assigned_imprv_val]          NUMERIC (14)   CONSTRAINT [CDF__arb_protest_prot_boe_assigned_imprv_val] DEFAULT ((0)) NULL,
    [highly_disputed_property]             CHAR (1)       NULL,
    [begin_ag_hs_use_val]                  NUMERIC (14)   NULL,
    [begin_ag_hs_mkt_val]                  NUMERIC (14)   NULL,
    [begin_timber_hs_use_val]              NUMERIC (14)   NULL,
    [begin_timber_hs_mkt_val]              NUMERIC (14)   NULL,
    [begin_appraised_Classified]           NUMERIC (14)   NULL,
    [begin_appraised_NonClassified]        NUMERIC (14)   NULL,
    [final_ag_hs_use_val]                  NUMERIC (14)   NULL,
    [final_ag_hs_mkt_val]                  NUMERIC (14)   NULL,
    [final_timber_hs_use_val]              NUMERIC (14)   NULL,
    [final_timber_hs_mkt_val]              NUMERIC (14)   NULL,
    [final_appraised_Classified]           NUMERIC (14)   NULL,
    [final_appraised_NonClassified]        NUMERIC (14)   NULL,
    CONSTRAINT [CPK__arb_protest] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_protest_appraiser_meeting_appraiser_id] FOREIGN KEY ([appraiser_meeting_appraiser_id]) REFERENCES [dbo].[appraiser] ([appraiser_id]),
    CONSTRAINT [CFK__arb_protest_appraiser_meeting_id] FOREIGN KEY ([appraiser_meeting_id]) REFERENCES [dbo].[_arb_appraiser_meeting_schedule] ([meeting_id]),
    CONSTRAINT [CFK__arb_protest_decision_reason_cd] FOREIGN KEY ([decision_reason_cd]) REFERENCES [dbo].[_arb_protest_decision_reason] ([decision_reason_cd]),
    CONSTRAINT [CFK__arb_protest_docket_id] FOREIGN KEY ([docket_id]) REFERENCES [dbo].[_arb_protest_hearing_docket] ([docket_id]),
    CONSTRAINT [CFK__arb_protest_prot_affidavit_testimony_by] FOREIGN KEY ([prot_affidavit_testimony_by]) REFERENCES [dbo].[_arb_protest_affidavit_testimony_by] ([affidavit_testimony_by_cd]),
    CONSTRAINT [CFK__arb_protest_prot_affidavit_testimony_received] FOREIGN KEY ([prot_affidavit_testimony_received]) REFERENCES [dbo].[_arb_protest_affidavit_testimony_received] ([affidavit_testimony_received_cd]),
    CONSTRAINT [CFK__arb_protest_prot_assigned_panel] FOREIGN KEY ([prot_assigned_panel]) REFERENCES [dbo].[_arb_protest_panel] ([panel_cd]),
    CONSTRAINT [CFK__arb_protest_prot_first_motion_decision_cd] FOREIGN KEY ([prot_first_motion_decision_cd]) REFERENCES [dbo].[_arb_protest_decision] ([decision_cd]),
    CONSTRAINT [CFK__arb_protest_prot_second_motion_decision_cd] FOREIGN KEY ([prot_second_motion_decision_cd]) REFERENCES [dbo].[_arb_protest_decision] ([decision_cd]),
    CONSTRAINT [CFK__arb_protest_prot_status] FOREIGN KEY ([prot_status]) REFERENCES [dbo].[_arb_protest_status] ([status_cd]),
    CONSTRAINT [CFK__arb_protest_prot_type] FOREIGN KEY ([prot_type]) REFERENCES [dbo].[_arb_protest_type] ([protest_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_case_id_prop_val_yr]
    ON [dbo].[_arb_protest]([case_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_docket_id]
    ON [dbo].[_arb_protest]([docket_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prot_appr_docket_id]
    ON [dbo].[_arb_protest]([prot_appr_docket_id] ASC) WITH (FILLFACTOR = 80);


GO


create trigger tr__arb_protest_delete_ChangeLog
on _arb_protest
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
          chg_log_tables = '_arb_protest' and
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
 
declare @prop_id int
declare @prop_val_yr numeric(4,0)
declare @case_id int
 
declare curRows cursor
for
     select prop_id, prop_val_yr, case_id from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @case_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @case_id) + '-' + convert(varchar(4), @prop_val_yr)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 23, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
 
     fetch next from curRows into @prop_id, @prop_val_yr, @case_id
end
 
close curRows
deallocate curRows

GO


create trigger tr__arb_protest_update
	on _arb_protest
	for update
as

set nocount on

	declare
		@lOldPropID int,
		@lNewPropID int,
		@lOldDocketID int,
		@lNewDocketID int,
		@lOldApprDocketID int,
		@lNewApprDocketID int,
		@szHearingType varchar(10)

	select
		@lOldPropID = prop_id,
		@lOldDocketID = docket_id,
		@lOldApprDocketID = prot_appr_docket_id
	from deleted

	select
		@lNewPropID = prop_id,
		@lNewDocketID = docket_id,
		@lNewApprDocketID = prot_appr_docket_id
	from inserted
	
	/* If the protest is or was scheduled */
	if (
		@lOldDocketID <> @lNewDocketID
		or
		(@lOldDocketID is null and @lNewDocketID is not null)
		or
		(@lOldDocketID is not null and @lNewDocketID is null)
		or
		@lOldPropID <> @lNewPropID
	)
	begin
		/* Maintain the count of scheduled protests for the docket(s) */
		if ( @lOldDocketID is not null )
		begin
			update _arb_protest_hearing_docket with(rowlock) set
				scheduled_protest_count = (
					select count( arb.prop_id)
					from _arb_protest as arb with(nolock)
					where
						docket_id = @lOldDocketID
				)
			where
				docket_id = @lOldDocketID

			select
				@szHearingType = h.szHearingType
			from _arb_protest_hearing_docket as d
			join _arb_protest_hearing as h on
				d.lHearingID = h.lHearingID
			where
				d.docket_id = @lOldDocketID

			if ( @szHearingType = 'A' )
			begin
				/* Maintain the count of agents who have protests for the docket */
				update _arb_protest_hearing_docket with(rowlock) set
					scheduled_agent_count = (
						select count(distinct agent.agent_id)
						from _arb_protest as arb
						join agent on agent.arb_docket_id = @lOldDocketID
						where
							arb.docket_id = @lOldDocketID
					)
				where
					docket_id = @lOldDocketID
			end
		end

		if ( @lNewDocketID is not null )
		begin
			update _arb_protest_hearing_docket with(rowlock) set
				scheduled_protest_count = (
					select count(arb.prop_id)
					from _arb_protest as arb with(nolock)
					where
						docket_id = @lNewDocketID
				)
			where
				docket_id = @lNewDocketID

			select
				@szHearingType = h.szHearingType
			from _arb_protest_hearing_docket as d
			join _arb_protest_hearing as h on
				d.lHearingID = h.lHearingID
			where
				d.docket_id = @lNewDocketID

			if ( @szHearingType = 'A' )
			begin
				/* Maintain the count of agents who have protests for the docket */
				update _arb_protest_hearing_docket with(rowlock) set
					scheduled_agent_count = (
						select count(distinct agent.agent_id)
						from _arb_protest as arb
						join agent on agent.arb_docket_id = @lNewDocketID
						where
							arb.docket_id = @lNewDocketID
					)
				where
					docket_id = @lNewDocketID
			end
		end
	end

	/* If the appraiser is or was scheduled */
	if (
		@lOldApprDocketID <> @lNewApprDocketID
		or
		(@lOldApprDocketID is null and @lNewApprDocketID is not null)
		or
		(@lOldApprDocketID is not null and @lNewApprDocketID is null)
		or
		@lOldPropID <> @lNewPropID
	)
	begin
		/* Maintain the count of scheduled protests for the docket(s) */
		if ( @lOldApprDocketID is not null )
		begin
			update _arb_protest_hearing_docket with(rowlock) set
				scheduled_protest_count =
				(
					select count( arb.prop_id)
					from _arb_protest as arb with(nolock)
					where prot_appr_docket_id = @lOldApprDocketID
				)
			where docket_id = @lOldApprDocketID
		end

		if ( @lNewApprDocketID is not null )
		begin
			update _arb_protest_hearing_docket with(rowlock) set
				scheduled_protest_count =
				(
					select count( arb.prop_id)
					from _arb_protest as arb with(nolock)
					where prot_appr_docket_id = @lNewApprDocketID
				)
			where docket_id = @lNewApprDocketID
		end
	end

set nocount off

GO


create trigger tr__arb_protest_insert
on _arb_protest
for insert
not for replication
as

set nocount on

	declare
		@lDocketID int,
		@lApprDocketID int,
		@szHearingType varchar(10)

	select
		@lDocketID = docket_id,
		@lApprDocketID = prot_appr_docket_id
	from inserted
	
	/* If the protest is scheduled */
	if ( @lDocketID is not null )
	begin
		/*
		update _arb_protest_hearing_docket with(rowlock) set
			scheduled_protest_count = scheduled_protest_count + 1
		where
			docket_id = @lDocketID
		*/

		/* Maintain the count of scheduled protests for the docket */
		update _arb_protest_hearing_docket with(rowlock) set
			scheduled_protest_count = (
				select count (arb.prop_id)
				from _arb_protest as arb with(nolock)
				where
					docket_id = @lDocketID
			)
		where
			docket_id = @lDocketID

		select
			@szHearingType = h.szHearingType
		from _arb_protest_hearing_docket as d
		join _arb_protest_hearing as h on
			d.lHearingID = h.lHearingID
		where
			d.docket_id = @lDocketID

		if ( @szHearingType = 'A' )
		begin
			/* Maintain the count of agents who have protests for the docket */
			update _arb_protest_hearing_docket with(rowlock) set
				scheduled_agent_count = (
					select count(distinct agent.agent_id)
					from _arb_protest as arb
					join agent on agent.arb_docket_id = @lDocketID
					where
						arb.docket_id = @lDocketID
				)
			where
				docket_id = @lDocketID
		end
	end

	/* If the appraiser is scheduled */
	if ( @lApprDocketID is not null )
	begin
		/* Maintain the count of scheduled protests for the docket */
		update _arb_protest_hearing_docket with(rowlock) set
			scheduled_protest_count =
			(
				select count( arb.prop_id)
				from _arb_protest as arb with(nolock)
				where prot_appr_docket_id = @lApprDocketID
			)
		where docket_id = @lApprDocketID
	end

set nocount off

GO


create trigger [dbo].[tr__arb_protest_update_ChangeLog]
on [dbo].[_arb_protest]
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
 
declare @old_prop_id int
declare @new_prop_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_case_id int
declare @new_case_id int
declare @old_prot_create_dt datetime
declare @new_prot_create_dt datetime
declare @old_prot_complete_dt datetime
declare @new_prot_complete_dt datetime
declare @old_prot_type varchar(10)
declare @new_prot_type varchar(10)
declare @old_prot_status varchar(10)
declare @new_prot_status varchar(10)
declare @old_prot_taxpayer_doc_requested char(1)
declare @new_prot_taxpayer_doc_requested char(1)
declare @old_prot_taxpayer_doc_recorded_dt datetime
declare @new_prot_taxpayer_doc_recorded_dt datetime
declare @old_prot_taxpayer_evidence_requested char(1)
declare @new_prot_taxpayer_evidence_requested char(1)
declare @old_prot_taxpayer_evidence_requested_dt datetime
declare @new_prot_taxpayer_evidence_requested_dt datetime
declare @old_prot_taxpayer_evidence_delivered_dt datetime
declare @new_prot_taxpayer_evidence_delivered_dt datetime
declare @old_prot_taxpayer_evidence_staff int
declare @new_prot_taxpayer_evidence_staff int
declare @old_prot_taxpayer_additional_evidence char(1)
declare @new_prot_taxpayer_additional_evidence char(1)
declare @old_prot_taxpayer_evidence_waiver char(1)
declare @new_prot_taxpayer_evidence_waiver char(1)
declare @old_prot_taxes_paid char(1)
declare @new_prot_taxes_paid char(1)
declare @old_prot_taxes_paid_verified_staff_id int
declare @new_prot_taxes_paid_verified_staff_id int
declare @old_prot_taxes_paid_verified_dt datetime
declare @new_prot_taxes_paid_verified_dt datetime
declare @old_prot_appraisal_staff int
declare @new_prot_appraisal_staff int
declare @old_prot_comments varchar(1024)
declare @new_prot_comments varchar(1024)
declare @old_prot_affidavit_testimony_dt datetime
declare @new_prot_affidavit_testimony_dt datetime
declare @old_prot_affidavit_testimony_by varchar(10)
declare @new_prot_affidavit_testimony_by varchar(10)
declare @old_prot_affidavit_testimony_received varchar(10)
declare @new_prot_affidavit_testimony_received varchar(10)
declare @old_docket_id int
declare @new_docket_id int
declare @old_prot_assigned_panel varchar(10)
declare @new_prot_assigned_panel varchar(10)
declare @old_prot_arrived_dt datetime
declare @new_prot_arrived_dt datetime
declare @old_prot_hearing_rescheduled char(1)
declare @new_prot_hearing_rescheduled char(1)
declare @old_prot_packet_printed_dt datetime
declare @new_prot_packet_printed_dt datetime
declare @old_prot_full_board_hearing char(1)
declare @new_prot_full_board_hearing char(1)
declare @old_prot_hearing_appraisal_staff int
declare @new_prot_hearing_appraisal_staff int
declare @old_prot_hearing_start_dt datetime
declare @new_prot_hearing_start_dt datetime
declare @old_prot_hearing_finished_dt datetime
declare @new_prot_hearing_finished_dt datetime
declare @old_prot_hearing_recorder_id int
declare @new_prot_hearing_recorder_id int
declare @old_prot_taxpayer_comments varchar(1024)
declare @new_prot_taxpayer_comments varchar(1024)
declare @old_prot_district_comments varchar(1024)
declare @new_prot_district_comments varchar(1024)
declare @old_prot_first_motion varchar(500)
declare @new_prot_first_motion varchar(500)
declare @old_prot_sustain_district_val char(1)
declare @new_prot_sustain_district_val char(1)
declare @old_prot_first_motion_by varchar(10)
declare @new_prot_first_motion_by varchar(10)
declare @old_prot_first_motion_seconded_by varchar(10)
declare @new_prot_first_motion_seconded_by varchar(10)
declare @old_prot_first_motion_pass char(1)
declare @new_prot_first_motion_pass char(1)
declare @old_prot_first_motion_decision_cd varchar(10)
declare @new_prot_first_motion_decision_cd varchar(10)
declare @old_prot_first_motion_decision_dt datetime
declare @new_prot_first_motion_decision_dt datetime
declare @old_prot_appraiser_assigned_val numeric(14,0)
declare @new_prot_appraiser_assigned_val numeric(14,0)
declare @old_prot_arb_assigned_val numeric(14,0)
declare @new_prot_arb_assigned_val numeric(14,0)
declare @old_prot_val_type char(1)
declare @new_prot_val_type char(1)
declare @old_prot_arb_instructions varchar(500)
declare @new_prot_arb_instructions varchar(500)
declare @old_prot_second_motion varchar(500)
declare @new_prot_second_motion varchar(500)
declare @old_prot_second_motion_by varchar(10)
declare @new_prot_second_motion_by varchar(10)
declare @old_prot_second_motion_seconded_by varchar(10)
declare @new_prot_second_motion_seconded_by varchar(10)
declare @old_prot_second_motion_pass char(1)
declare @new_prot_second_motion_pass char(1)
declare @old_prot_second_motion_decision_cd varchar(10)
declare @new_prot_second_motion_decision_cd varchar(10)
declare @old_prot_second_motion_decision_dt datetime
declare @new_prot_second_motion_decision_dt datetime
declare @old_prot_other_motion varchar(500)
declare @new_prot_other_motion varchar(500)
declare @old_prot_full_ratification_dt datetime
declare @new_prot_full_ratification_dt datetime
declare @old_begin_land_hstd_val numeric(14,0)
declare @new_begin_land_hstd_val numeric(14,0)
declare @old_begin_land_non_hstd_val numeric(14,0)
declare @new_begin_land_non_hstd_val numeric(14,0)
declare @old_begin_imprv_hstd_val numeric(14,0)
declare @new_begin_imprv_hstd_val numeric(14,0)
declare @old_begin_imprv_non_hstd_val numeric(14,0)
declare @new_begin_imprv_non_hstd_val numeric(14,0)
declare @old_begin_ag_use_val numeric(14,0)
declare @new_begin_ag_use_val numeric(14,0)
declare @old_begin_ag_market numeric(14,0)
declare @new_begin_ag_market numeric(14,0)
declare @old_begin_timber_use numeric(14,0)
declare @new_begin_timber_use numeric(14,0)
declare @old_begin_timber_market numeric(14,0)
declare @new_begin_timber_market numeric(14,0)
declare @old_begin_market numeric(14,0)
declare @new_begin_market numeric(14,0)
declare @old_begin_appraised_val numeric(14,0)
declare @new_begin_appraised_val numeric(14,0)
declare @old_begin_ten_percent_cap numeric(14,0)
declare @new_begin_ten_percent_cap numeric(14,0)
declare @old_begin_assessed_val numeric(14,0)
declare @new_begin_assessed_val numeric(14,0)
declare @old_begin_rendered_val numeric(14,0)
declare @new_begin_rendered_val numeric(14,0)
declare @old_begin_exemptions varchar(50)
declare @new_begin_exemptions varchar(50)
declare @old_begin_entities varchar(50)
declare @new_begin_entities varchar(50)
declare @old_begin_recalc_dt datetime
declare @new_begin_recalc_dt datetime
declare @old_final_land_hstd_val numeric(14,0)
declare @new_final_land_hstd_val numeric(14,0)
declare @old_final_land_non_hstd_val numeric(14,0)
declare @new_final_land_non_hstd_val numeric(14,0)
declare @old_final_imprv_hstd_val numeric(14,0)
declare @new_final_imprv_hstd_val numeric(14,0)
declare @old_final_imprv_non_hstd_val numeric(14,0)
declare @new_final_imprv_non_hstd_val numeric(14,0)
declare @old_final_ag_use_val numeric(14,0)
declare @new_final_ag_use_val numeric(14,0)
declare @old_final_ag_market numeric(14,0)
declare @new_final_ag_market numeric(14,0)
declare @old_final_timber_use numeric(14,0)
declare @new_final_timber_use numeric(14,0)
declare @old_final_timber_market numeric(14,0)
declare @new_final_timber_market numeric(14,0)
declare @old_final_market numeric(14,0)
declare @new_final_market numeric(14,0)
declare @old_final_appraised_val numeric(14,0)
declare @new_final_appraised_val numeric(14,0)
declare @old_final_ten_percent_cap numeric(14,0)
declare @new_final_ten_percent_cap numeric(14,0)
declare @old_final_assessed_val numeric(14,0)
declare @new_final_assessed_val numeric(14,0)
declare @old_final_rendered_val numeric(14,0)
declare @new_final_rendered_val numeric(14,0)
declare @old_final_exemptions varchar(50)
declare @new_final_exemptions varchar(50)
declare @old_final_entities varchar(50)
declare @new_final_entities varchar(50)
declare @old_final_recalc_dt datetime
declare @new_final_recalc_dt datetime
declare @old_bGridComplete bit
declare @new_bGridComplete bit
declare @old_closed_pacs_user_id int
declare @new_closed_pacs_user_id int
declare @old_bGenerateCompGrid bit
declare @new_bGenerateCompGrid bit
declare @old_status_date_changed datetime
declare @new_status_date_changed datetime
declare @old_status_changed_user_id int
declare @new_status_changed_user_id int
declare @old_associated_inquiry int
declare @new_associated_inquiry int
declare @old_appraiser_meeting_id int
declare @new_appraiser_meeting_id int
declare @old_appraiser_meeting_appraiser_id int
declare @new_appraiser_meeting_appraiser_id int
declare @old_appraiser_meeting_date_time datetime
declare @new_appraiser_meeting_date_time datetime
declare @old_appraiser_meeting_appraiser_comments varchar(1024)
declare @new_appraiser_meeting_appraiser_comments varchar(1024)
declare @old_appraiser_meeting_taxpayer_comments varchar(1024)
declare @new_appraiser_meeting_taxpayer_comments varchar(1024)
declare @old_prot_appr_meeting_arrived_dt datetime
declare @new_prot_appr_meeting_arrived_dt datetime
declare @old_prot_appr_docket_id int
declare @new_prot_appr_docket_id int
declare @old_case_prepared bit
declare @new_case_prepared bit
declare @old_opinion_of_value numeric(14,0)
declare @new_opinion_of_value numeric(14,0)
declare @old_decision_reason_cd varchar(10)
declare @new_decision_reason_cd varchar(10)

declare @old_highly_disputed_property char(1)
declare @new_highly_disputed_property char(1)

 
declare curRows cursor
for select 
	d.prop_id, d.prop_val_yr, d.case_id, d.prot_create_dt, d.prot_complete_dt, d.prot_type, d.prot_status, d.prot_taxpayer_doc_requested, d.prot_taxpayer_doc_recorded_dt, d.prot_taxpayer_evidence_requested, d.prot_taxpayer_evidence_requested_dt, d.prot_taxpayer_evidence_delivered_dt, d.prot_taxpayer_evidence_staff, d.prot_taxpayer_additional_evidence, d.prot_taxpayer_evidence_waiver, d.prot_taxes_paid, d.prot_taxes_paid_verified_staff_id, d.prot_taxes_paid_verified_dt, d.prot_appraisal_staff, d.prot_comments, d.prot_affidavit_testimony_dt, d.prot_affidavit_testimony_by, d.prot_affidavit_testimony_received, d.docket_id, d.prot_assigned_panel, d.prot_arrived_dt, d.prot_hearing_rescheduled, d.prot_packet_printed_dt, d.prot_full_board_hearing, d.prot_hearing_appraisal_staff, d.prot_hearing_start_dt, d.prot_hearing_finished_dt, d.prot_hearing_recorder_id, d.prot_taxpayer_comments, d.prot_district_comments, d.prot_first_motion, d.prot_sustain_district_val, d.prot_first_motion_by, d.prot_first_motion_seconded_by, d.prot_first_motion_pass, d.prot_first_motion_decision_cd, d.prot_first_motion_decision_dt, d.prot_appraiser_assigned_val, d.prot_arb_assigned_val, d.prot_val_type, d.prot_arb_instructions, d.prot_second_motion, d.prot_second_motion_by, d.prot_second_motion_seconded_by, d.prot_second_motion_pass, d.prot_second_motion_decision_cd, d.prot_second_motion_decision_dt, d.prot_other_motion, d.prot_full_ratification_dt, d.begin_land_hstd_val, d.begin_land_non_hstd_val, d.begin_imprv_hstd_val, d.begin_imprv_non_hstd_val, d.begin_ag_use_val, d.begin_ag_market, d.begin_timber_use, d.begin_timber_market, d.begin_market, d.begin_appraised_val, d.begin_ten_percent_cap, d.begin_assessed_val, d.begin_rendered_val, d.begin_exemptions, d.begin_entities, d.begin_recalc_dt, d.final_land_hstd_val, d.final_land_non_hstd_val, d.final_imprv_hstd_val, d.final_imprv_non_hstd_val, d.final_ag_use_val, d.final_ag_market, d.final_timber_use, d.final_timber_market, d.final_market, d.final_appraised_val, d.final_ten_percent_cap, d.final_assessed_val, d.final_rendered_val, d.final_exemptions, d.final_entities, d.final_recalc_dt, d.bGridComplete, d.closed_pacs_user_id, d.bGenerateCompGrid, d.status_date_changed, d.status_changed_user_id, d.associated_inquiry, d.appraiser_meeting_id, d.appraiser_meeting_appraiser_id, d.appraiser_meeting_date_time, d.appraiser_meeting_appraiser_comments, d.appraiser_meeting_taxpayer_comments, d.prot_appr_meeting_arrived_dt, d.prot_appr_docket_id, d.case_prepared, d.opinion_of_value, d.decision_reason_cd, d.highly_disputed_property,
	i.prop_id, i.prop_val_yr, i.case_id, i.prot_create_dt, i.prot_complete_dt, i.prot_type, i.prot_status, i.prot_taxpayer_doc_requested, i.prot_taxpayer_doc_recorded_dt, i.prot_taxpayer_evidence_requested, i.prot_taxpayer_evidence_requested_dt, i.prot_taxpayer_evidence_delivered_dt, i.prot_taxpayer_evidence_staff, i.prot_taxpayer_additional_evidence, i.prot_taxpayer_evidence_waiver, i.prot_taxes_paid, i.prot_taxes_paid_verified_staff_id, i.prot_taxes_paid_verified_dt, i.prot_appraisal_staff, i.prot_comments, i.prot_affidavit_testimony_dt, i.prot_affidavit_testimony_by, i.prot_affidavit_testimony_received, i.docket_id, i.prot_assigned_panel, i.prot_arrived_dt, i.prot_hearing_rescheduled, i.prot_packet_printed_dt, i.prot_full_board_hearing, i.prot_hearing_appraisal_staff, i.prot_hearing_start_dt, i.prot_hearing_finished_dt, i.prot_hearing_recorder_id, i.prot_taxpayer_comments, i.prot_district_comments, i.prot_first_motion, i.prot_sustain_district_val, i.prot_first_motion_by, i.prot_first_motion_seconded_by, i.prot_first_motion_pass, i.prot_first_motion_decision_cd, i.prot_first_motion_decision_dt, i.prot_appraiser_assigned_val, i.prot_arb_assigned_val, i.prot_val_type, i.prot_arb_instructions, i.prot_second_motion, i.prot_second_motion_by, i.prot_second_motion_seconded_by, i.prot_second_motion_pass, i.prot_second_motion_decision_cd, i.prot_second_motion_decision_dt, i.prot_other_motion, i.prot_full_ratification_dt, i.begin_land_hstd_val, i.begin_land_non_hstd_val, i.begin_imprv_hstd_val, i.begin_imprv_non_hstd_val, i.begin_ag_use_val, i.begin_ag_market, i.begin_timber_use, i.begin_timber_market, i.begin_market, i.begin_appraised_val, i.begin_ten_percent_cap, i.begin_assessed_val, i.begin_rendered_val, i.begin_exemptions, i.begin_entities, i.begin_recalc_dt, i.final_land_hstd_val, i.final_land_non_hstd_val, i.final_imprv_hstd_val, i.final_imprv_non_hstd_val, i.final_ag_use_val, i.final_ag_market, i.final_timber_use, i.final_timber_market, i.final_market, i.final_appraised_val, i.final_ten_percent_cap, i.final_assessed_val, i.final_rendered_val, i.final_exemptions, i.final_entities, i.final_recalc_dt, i.bGridComplete, i.closed_pacs_user_id, i.bGenerateCompGrid, i.status_date_changed, i.status_changed_user_id, i.associated_inquiry, i.appraiser_meeting_id, i.appraiser_meeting_appraiser_id, i.appraiser_meeting_date_time, i.appraiser_meeting_appraiser_comments, i.appraiser_meeting_taxpayer_comments, i.prot_appr_meeting_arrived_dt, i.prot_appr_docket_id, i.case_prepared, i.opinion_of_value, i.decision_reason_cd, i.highly_disputed_property
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.prop_val_yr = i.prop_val_yr and
     d.case_id = i.case_id
for read only
 
open curRows
fetch next from curRows into 
	@old_prop_id, @old_prop_val_yr, @old_case_id, @old_prot_create_dt, @old_prot_complete_dt, @old_prot_type, @old_prot_status, @old_prot_taxpayer_doc_requested, @old_prot_taxpayer_doc_recorded_dt, @old_prot_taxpayer_evidence_requested, @old_prot_taxpayer_evidence_requested_dt, @old_prot_taxpayer_evidence_delivered_dt, @old_prot_taxpayer_evidence_staff, @old_prot_taxpayer_additional_evidence, @old_prot_taxpayer_evidence_waiver, @old_prot_taxes_paid, @old_prot_taxes_paid_verified_staff_id, @old_prot_taxes_paid_verified_dt, @old_prot_appraisal_staff, @old_prot_comments, @old_prot_affidavit_testimony_dt, @old_prot_affidavit_testimony_by, @old_prot_affidavit_testimony_received, @old_docket_id, @old_prot_assigned_panel, @old_prot_arrived_dt, @old_prot_hearing_rescheduled, @old_prot_packet_printed_dt, @old_prot_full_board_hearing, @old_prot_hearing_appraisal_staff, @old_prot_hearing_start_dt, @old_prot_hearing_finished_dt, @old_prot_hearing_recorder_id, @old_prot_taxpayer_comments, @old_prot_district_comments, @old_prot_first_motion, @old_prot_sustain_district_val, @old_prot_first_motion_by, @old_prot_first_motion_seconded_by, @old_prot_first_motion_pass, @old_prot_first_motion_decision_cd, @old_prot_first_motion_decision_dt, @old_prot_appraiser_assigned_val, @old_prot_arb_assigned_val, @old_prot_val_type, @old_prot_arb_instructions, @old_prot_second_motion, @old_prot_second_motion_by, @old_prot_second_motion_seconded_by, @old_prot_second_motion_pass, @old_prot_second_motion_decision_cd, @old_prot_second_motion_decision_dt, @old_prot_other_motion, @old_prot_full_ratification_dt, @old_begin_land_hstd_val, @old_begin_land_non_hstd_val, @old_begin_imprv_hstd_val, @old_begin_imprv_non_hstd_val, @old_begin_ag_use_val, @old_begin_ag_market, @old_begin_timber_use, @old_begin_timber_market, @old_begin_market, @old_begin_appraised_val, @old_begin_ten_percent_cap, @old_begin_assessed_val, @old_begin_rendered_val, @old_begin_exemptions, @old_begin_entities, @old_begin_recalc_dt, @old_final_land_hstd_val, @old_final_land_non_hstd_val, @old_final_imprv_hstd_val, @old_final_imprv_non_hstd_val, @old_final_ag_use_val, @old_final_ag_market, @old_final_timber_use, @old_final_timber_market, @old_final_market, @old_final_appraised_val, @old_final_ten_percent_cap, @old_final_assessed_val, @old_final_rendered_val, @old_final_exemptions, @old_final_entities, @old_final_recalc_dt, @old_bGridComplete, @old_closed_pacs_user_id, @old_bGenerateCompGrid, @old_status_date_changed, @old_status_changed_user_id, @old_associated_inquiry, @old_appraiser_meeting_id, @old_appraiser_meeting_appraiser_id, @old_appraiser_meeting_date_time, @old_appraiser_meeting_appraiser_comments, @old_appraiser_meeting_taxpayer_comments, @old_prot_appr_meeting_arrived_dt, @old_prot_appr_docket_id, @old_case_prepared, @old_opinion_of_value, @old_decision_reason_cd, @old_highly_disputed_property,
	@new_prop_id, @new_prop_val_yr, @new_case_id, @new_prot_create_dt, @new_prot_complete_dt, @new_prot_type, @new_prot_status, @new_prot_taxpayer_doc_requested, @new_prot_taxpayer_doc_recorded_dt, @new_prot_taxpayer_evidence_requested, @new_prot_taxpayer_evidence_requested_dt, @new_prot_taxpayer_evidence_delivered_dt, @new_prot_taxpayer_evidence_staff, @new_prot_taxpayer_additional_evidence, @new_prot_taxpayer_evidence_waiver, @new_prot_taxes_paid, @new_prot_taxes_paid_verified_staff_id, @new_prot_taxes_paid_verified_dt, @new_prot_appraisal_staff, @new_prot_comments, @new_prot_affidavit_testimony_dt, @new_prot_affidavit_testimony_by, @new_prot_affidavit_testimony_received, @new_docket_id, @new_prot_assigned_panel, @new_prot_arrived_dt, @new_prot_hearing_rescheduled, @new_prot_packet_printed_dt, @new_prot_full_board_hearing, @new_prot_hearing_appraisal_staff, @new_prot_hearing_start_dt, @new_prot_hearing_finished_dt, @new_prot_hearing_recorder_id, @new_prot_taxpayer_comments, @new_prot_district_comments, @new_prot_first_motion, @new_prot_sustain_district_val, @new_prot_first_motion_by, @new_prot_first_motion_seconded_by, @new_prot_first_motion_pass, @new_prot_first_motion_decision_cd, @new_prot_first_motion_decision_dt, @new_prot_appraiser_assigned_val, @new_prot_arb_assigned_val, @new_prot_val_type, @new_prot_arb_instructions, @new_prot_second_motion, @new_prot_second_motion_by, @new_prot_second_motion_seconded_by, @new_prot_second_motion_pass, @new_prot_second_motion_decision_cd, @new_prot_second_motion_decision_dt, @new_prot_other_motion, @new_prot_full_ratification_dt, @new_begin_land_hstd_val, @new_begin_land_non_hstd_val, @new_begin_imprv_hstd_val, @new_begin_imprv_non_hstd_val, @new_begin_ag_use_val, @new_begin_ag_market, @new_begin_timber_use, @new_begin_timber_market, @new_begin_market, @new_begin_appraised_val, @new_begin_ten_percent_cap, @new_begin_assessed_val, @new_begin_rendered_val, @new_begin_exemptions, @new_begin_entities, @new_begin_recalc_dt, @new_final_land_hstd_val, @new_final_land_non_hstd_val, @new_final_imprv_hstd_val, @new_final_imprv_non_hstd_val, @new_final_ag_use_val, @new_final_ag_market, @new_final_timber_use, @new_final_timber_market, @new_final_market, @new_final_appraised_val, @new_final_ten_percent_cap, @new_final_assessed_val, @new_final_rendered_val, @new_final_exemptions, @new_final_entities, @new_final_recalc_dt, @new_bGridComplete, @new_closed_pacs_user_id, @new_bGenerateCompGrid, @new_status_date_changed, @new_status_changed_user_id, @new_associated_inquiry, @new_appraiser_meeting_id, @new_appraiser_meeting_appraiser_id, @new_appraiser_meeting_date_time, @new_appraiser_meeting_appraiser_comments, @new_appraiser_meeting_taxpayer_comments, @new_prot_appr_meeting_arrived_dt, @new_prot_appr_docket_id, @new_case_prepared, @new_opinion_of_value, @new_decision_reason_cd, @new_highly_disputed_property
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @new_case_id) + '-' + convert(varchar(4), @new_prop_val_yr)
 
     if (
          @old_prop_id <> @new_prop_id
          or
          ( @old_prop_id is null and @new_prop_id is not null ) 
          or
          ( @old_prop_id is not null and @new_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prop_val_yr <> @new_prop_val_yr
          or
          ( @old_prop_val_yr is null and @new_prop_val_yr is not null ) 
          or
          ( @old_prop_val_yr is not null and @new_prop_val_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_case_id <> @new_case_id
          or
          ( @old_case_id is null and @new_case_id is not null ) 
          or
          ( @old_case_id is not null and @new_case_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'case_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 612, convert(varchar(255), @old_case_id), convert(varchar(255), @new_case_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_create_dt <> @new_prot_create_dt
          or
          ( @old_prot_create_dt is null and @new_prot_create_dt is not null ) 
          or
          ( @old_prot_create_dt is not null and @new_prot_create_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_create_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4112, convert(varchar(255), @old_prot_create_dt), convert(varchar(255), @new_prot_create_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_complete_dt <> @new_prot_complete_dt
          or
          ( @old_prot_complete_dt is null and @new_prot_complete_dt is not null ) 
          or
          ( @old_prot_complete_dt is not null and @new_prot_complete_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_complete_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4111, convert(varchar(255), @old_prot_complete_dt), convert(varchar(255), @new_prot_complete_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_type <> @new_prot_type
          or
          ( @old_prot_type is null and @new_prot_type is not null ) 
          or
          ( @old_prot_type is not null and @new_prot_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4150, convert(varchar(255), @old_prot_type), convert(varchar(255), @new_prot_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_status <> @new_prot_status
          or
          ( @old_prot_status is null and @new_prot_status is not null ) 
          or
          ( @old_prot_status is not null and @new_prot_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4136, convert(varchar(255), @old_prot_status), convert(varchar(255), @new_prot_status), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_doc_requested <> @new_prot_taxpayer_doc_requested
          or
          ( @old_prot_taxpayer_doc_requested is null and @new_prot_taxpayer_doc_requested is not null ) 
          or
          ( @old_prot_taxpayer_doc_requested is not null and @new_prot_taxpayer_doc_requested is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_doc_requested' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4144, convert(varchar(255), @old_prot_taxpayer_doc_requested), convert(varchar(255), @new_prot_taxpayer_doc_requested), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_doc_recorded_dt <> @new_prot_taxpayer_doc_recorded_dt
          or
          ( @old_prot_taxpayer_doc_recorded_dt is null and @new_prot_taxpayer_doc_recorded_dt is not null ) 
          or
          ( @old_prot_taxpayer_doc_recorded_dt is not null and @new_prot_taxpayer_doc_recorded_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_doc_recorded_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4143, convert(varchar(255), @old_prot_taxpayer_doc_recorded_dt), convert(varchar(255), @new_prot_taxpayer_doc_recorded_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_evidence_requested <> @new_prot_taxpayer_evidence_requested
          or
          ( @old_prot_taxpayer_evidence_requested is null and @new_prot_taxpayer_evidence_requested is not null ) 
          or
          ( @old_prot_taxpayer_evidence_requested is not null and @new_prot_taxpayer_evidence_requested is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_evidence_requested' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4146, convert(varchar(255), @old_prot_taxpayer_evidence_requested), convert(varchar(255), @new_prot_taxpayer_evidence_requested), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_evidence_requested_dt <> @new_prot_taxpayer_evidence_requested_dt
          or
          ( @old_prot_taxpayer_evidence_requested_dt is null and @new_prot_taxpayer_evidence_requested_dt is not null ) 
          or
          ( @old_prot_taxpayer_evidence_requested_dt is not null and @new_prot_taxpayer_evidence_requested_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_evidence_requested_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4147, convert(varchar(255), @old_prot_taxpayer_evidence_requested_dt), convert(varchar(255), @new_prot_taxpayer_evidence_requested_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_evidence_delivered_dt <> @new_prot_taxpayer_evidence_delivered_dt
          or
          ( @old_prot_taxpayer_evidence_delivered_dt is null and @new_prot_taxpayer_evidence_delivered_dt is not null ) 
          or
          ( @old_prot_taxpayer_evidence_delivered_dt is not null and @new_prot_taxpayer_evidence_delivered_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_evidence_delivered_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4145, convert(varchar(255), @old_prot_taxpayer_evidence_delivered_dt), convert(varchar(255), @new_prot_taxpayer_evidence_delivered_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_evidence_staff <> @new_prot_taxpayer_evidence_staff
          or
          ( @old_prot_taxpayer_evidence_staff is null and @new_prot_taxpayer_evidence_staff is not null ) 
          or
          ( @old_prot_taxpayer_evidence_staff is not null and @new_prot_taxpayer_evidence_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_evidence_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4148, convert(varchar(255), @old_prot_taxpayer_evidence_staff), convert(varchar(255), @new_prot_taxpayer_evidence_staff), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_additional_evidence <> @new_prot_taxpayer_additional_evidence
          or
          ( @old_prot_taxpayer_additional_evidence is null and @new_prot_taxpayer_additional_evidence is not null ) 
          or
          ( @old_prot_taxpayer_additional_evidence is not null and @new_prot_taxpayer_additional_evidence is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_additional_evidence' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4141, convert(varchar(255), @old_prot_taxpayer_additional_evidence), convert(varchar(255), @new_prot_taxpayer_additional_evidence), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_evidence_waiver <> @new_prot_taxpayer_evidence_waiver
          or
          ( @old_prot_taxpayer_evidence_waiver is null and @new_prot_taxpayer_evidence_waiver is not null ) 
          or
          ( @old_prot_taxpayer_evidence_waiver is not null and @new_prot_taxpayer_evidence_waiver is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_evidence_waiver' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4149, convert(varchar(255), @old_prot_taxpayer_evidence_waiver), convert(varchar(255), @new_prot_taxpayer_evidence_waiver), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxes_paid <> @new_prot_taxes_paid
          or
          ( @old_prot_taxes_paid is null and @new_prot_taxes_paid is not null ) 
          or
          ( @old_prot_taxes_paid is not null and @new_prot_taxes_paid is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxes_paid' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4138, convert(varchar(255), @old_prot_taxes_paid), convert(varchar(255), @new_prot_taxes_paid), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxes_paid_verified_staff_id <> @new_prot_taxes_paid_verified_staff_id
          or
          ( @old_prot_taxes_paid_verified_staff_id is null and @new_prot_taxes_paid_verified_staff_id is not null ) 
          or
          ( @old_prot_taxes_paid_verified_staff_id is not null and @new_prot_taxes_paid_verified_staff_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxes_paid_verified_staff_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4140, convert(varchar(255), @old_prot_taxes_paid_verified_staff_id), convert(varchar(255), @new_prot_taxes_paid_verified_staff_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxes_paid_verified_dt <> @new_prot_taxes_paid_verified_dt
          or
          ( @old_prot_taxes_paid_verified_dt is null and @new_prot_taxes_paid_verified_dt is not null ) 
          or
          ( @old_prot_taxes_paid_verified_dt is not null and @new_prot_taxes_paid_verified_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxes_paid_verified_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4139, convert(varchar(255), @old_prot_taxes_paid_verified_dt), convert(varchar(255), @new_prot_taxes_paid_verified_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_appraisal_staff <> @new_prot_appraisal_staff
          or
          ( @old_prot_appraisal_staff is null and @new_prot_appraisal_staff is not null ) 
          or
          ( @old_prot_appraisal_staff is not null and @new_prot_appraisal_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_appraisal_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4101, convert(varchar(255), @old_prot_appraisal_staff), convert(varchar(255), @new_prot_appraisal_staff), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_comments <> @new_prot_comments
          or
          ( @old_prot_comments is null and @new_prot_comments is not null ) 
          or
          ( @old_prot_comments is not null and @new_prot_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4110, convert(varchar(255), @old_prot_comments), convert(varchar(255), @new_prot_comments), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_affidavit_testimony_dt <> @new_prot_affidavit_testimony_dt
          or
          ( @old_prot_affidavit_testimony_dt is null and @new_prot_affidavit_testimony_dt is not null ) 
          or
          ( @old_prot_affidavit_testimony_dt is not null and @new_prot_affidavit_testimony_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_affidavit_testimony_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4099, convert(varchar(255), @old_prot_affidavit_testimony_dt), convert(varchar(255), @new_prot_affidavit_testimony_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_affidavit_testimony_by <> @new_prot_affidavit_testimony_by
          or
          ( @old_prot_affidavit_testimony_by is null and @new_prot_affidavit_testimony_by is not null ) 
          or
          ( @old_prot_affidavit_testimony_by is not null and @new_prot_affidavit_testimony_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_affidavit_testimony_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4098, convert(varchar(255), @old_prot_affidavit_testimony_by), convert(varchar(255), @new_prot_affidavit_testimony_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_affidavit_testimony_received <> @new_prot_affidavit_testimony_received
          or
          ( @old_prot_affidavit_testimony_received is null and @new_prot_affidavit_testimony_received is not null ) 
          or
          ( @old_prot_affidavit_testimony_received is not null and @new_prot_affidavit_testimony_received is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_affidavit_testimony_received' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4100, convert(varchar(255), @old_prot_affidavit_testimony_received), convert(varchar(255), @new_prot_affidavit_testimony_received), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_docket_id <> @new_docket_id
          or
          ( @old_docket_id is null and @new_docket_id is not null ) 
          or
          ( @old_docket_id is not null and @new_docket_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'docket_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1372, convert(varchar(255), @old_docket_id), convert(varchar(255), @new_docket_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_assigned_panel <> @new_prot_assigned_panel
          or
          ( @old_prot_assigned_panel is null and @new_prot_assigned_panel is not null ) 
          or
          ( @old_prot_assigned_panel is not null and @new_prot_assigned_panel is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_assigned_panel' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4106, convert(varchar(255), @old_prot_assigned_panel), convert(varchar(255), @new_prot_assigned_panel), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_arrived_dt <> @new_prot_arrived_dt
          or
          ( @old_prot_arrived_dt is null and @new_prot_arrived_dt is not null ) 
          or
          ( @old_prot_arrived_dt is not null and @new_prot_arrived_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_arrived_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4105, convert(varchar(255), @old_prot_arrived_dt), convert(varchar(255), @new_prot_arrived_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_hearing_rescheduled <> @new_prot_hearing_rescheduled
          or
          ( @old_prot_hearing_rescheduled is null and @new_prot_hearing_rescheduled is not null ) 
          or
          ( @old_prot_hearing_rescheduled is not null and @new_prot_hearing_rescheduled is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_hearing_rescheduled' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4125, convert(varchar(255), @old_prot_hearing_rescheduled), convert(varchar(255), @new_prot_hearing_rescheduled), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_packet_printed_dt <> @new_prot_packet_printed_dt
          or
          ( @old_prot_packet_printed_dt is null and @new_prot_packet_printed_dt is not null ) 
          or
          ( @old_prot_packet_printed_dt is not null and @new_prot_packet_printed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_packet_printed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4129, convert(varchar(255), @old_prot_packet_printed_dt), convert(varchar(255), @new_prot_packet_printed_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_full_board_hearing <> @new_prot_full_board_hearing
          or
          ( @old_prot_full_board_hearing is null and @new_prot_full_board_hearing is not null ) 
          or
          ( @old_prot_full_board_hearing is not null and @new_prot_full_board_hearing is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_full_board_hearing' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4120, convert(varchar(255), @old_prot_full_board_hearing), convert(varchar(255), @new_prot_full_board_hearing), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_hearing_appraisal_staff <> @new_prot_hearing_appraisal_staff
          or
          ( @old_prot_hearing_appraisal_staff is null and @new_prot_hearing_appraisal_staff is not null ) 
          or
          ( @old_prot_hearing_appraisal_staff is not null and @new_prot_hearing_appraisal_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_hearing_appraisal_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4122, convert(varchar(255), @old_prot_hearing_appraisal_staff), convert(varchar(255), @new_prot_hearing_appraisal_staff), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_hearing_start_dt <> @new_prot_hearing_start_dt
          or
          ( @old_prot_hearing_start_dt is null and @new_prot_hearing_start_dt is not null ) 
          or
          ( @old_prot_hearing_start_dt is not null and @new_prot_hearing_start_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_hearing_start_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4126, convert(varchar(255), @old_prot_hearing_start_dt), convert(varchar(255), @new_prot_hearing_start_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_hearing_finished_dt <> @new_prot_hearing_finished_dt
          or
          ( @old_prot_hearing_finished_dt is null and @new_prot_hearing_finished_dt is not null ) 
          or
          ( @old_prot_hearing_finished_dt is not null and @new_prot_hearing_finished_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_hearing_finished_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4123, convert(varchar(255), @old_prot_hearing_finished_dt), convert(varchar(255), @new_prot_hearing_finished_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_hearing_recorder_id <> @new_prot_hearing_recorder_id
          or
          ( @old_prot_hearing_recorder_id is null and @new_prot_hearing_recorder_id is not null ) 
          or
          ( @old_prot_hearing_recorder_id is not null and @new_prot_hearing_recorder_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_hearing_recorder_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4124, convert(varchar(255), @old_prot_hearing_recorder_id), convert(varchar(255), @new_prot_hearing_recorder_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_taxpayer_comments <> @new_prot_taxpayer_comments
          or
          ( @old_prot_taxpayer_comments is null and @new_prot_taxpayer_comments is not null ) 
          or
          ( @old_prot_taxpayer_comments is not null and @new_prot_taxpayer_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_taxpayer_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4142, convert(varchar(255), @old_prot_taxpayer_comments), convert(varchar(255), @new_prot_taxpayer_comments), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_district_comments <> @new_prot_district_comments
          or
          ( @old_prot_district_comments is null and @new_prot_district_comments is not null ) 
          or
          ( @old_prot_district_comments is not null and @new_prot_district_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_district_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4113, convert(varchar(255), @old_prot_district_comments), convert(varchar(255), @new_prot_district_comments), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_first_motion <> @new_prot_first_motion
          or
          ( @old_prot_first_motion is null and @new_prot_first_motion is not null ) 
          or
          ( @old_prot_first_motion is not null and @new_prot_first_motion is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_first_motion' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4114, convert(varchar(255), @old_prot_first_motion), convert(varchar(255), @new_prot_first_motion), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_sustain_district_val <> @new_prot_sustain_district_val
          or
          ( @old_prot_sustain_district_val is null and @new_prot_sustain_district_val is not null ) 
          or
          ( @old_prot_sustain_district_val is not null and @new_prot_sustain_district_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_sustain_district_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4137, convert(varchar(255), @old_prot_sustain_district_val), convert(varchar(255), @new_prot_sustain_district_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_first_motion_by <> @new_prot_first_motion_by
          or
          ( @old_prot_first_motion_by is null and @new_prot_first_motion_by is not null ) 
          or
          ( @old_prot_first_motion_by is not null and @new_prot_first_motion_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_first_motion_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4115, convert(varchar(255), @old_prot_first_motion_by), convert(varchar(255), @new_prot_first_motion_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_first_motion_seconded_by <> @new_prot_first_motion_seconded_by
          or
          ( @old_prot_first_motion_seconded_by is null and @new_prot_first_motion_seconded_by is not null ) 
          or
          ( @old_prot_first_motion_seconded_by is not null and @new_prot_first_motion_seconded_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_first_motion_seconded_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4119, convert(varchar(255), @old_prot_first_motion_seconded_by), convert(varchar(255), @new_prot_first_motion_seconded_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_first_motion_pass <> @new_prot_first_motion_pass
          or
          ( @old_prot_first_motion_pass is null and @new_prot_first_motion_pass is not null ) 
          or
          ( @old_prot_first_motion_pass is not null and @new_prot_first_motion_pass is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_first_motion_pass' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4118, convert(varchar(255), @old_prot_first_motion_pass), convert(varchar(255), @new_prot_first_motion_pass), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_first_motion_decision_cd <> @new_prot_first_motion_decision_cd
          or
          ( @old_prot_first_motion_decision_cd is null and @new_prot_first_motion_decision_cd is not null ) 
          or
          ( @old_prot_first_motion_decision_cd is not null and @new_prot_first_motion_decision_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_first_motion_decision_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4116, convert(varchar(255), @old_prot_first_motion_decision_cd), convert(varchar(255), @new_prot_first_motion_decision_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_first_motion_decision_dt <> @new_prot_first_motion_decision_dt
          or
          ( @old_prot_first_motion_decision_dt is null and @new_prot_first_motion_decision_dt is not null ) 
          or
          ( @old_prot_first_motion_decision_dt is not null and @new_prot_first_motion_decision_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_first_motion_decision_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4117, convert(varchar(255), @old_prot_first_motion_decision_dt), convert(varchar(255), @new_prot_first_motion_decision_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_appraiser_assigned_val <> @new_prot_appraiser_assigned_val
          or
          ( @old_prot_appraiser_assigned_val is null and @new_prot_appraiser_assigned_val is not null ) 
          or
          ( @old_prot_appraiser_assigned_val is not null and @new_prot_appraiser_assigned_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_appraiser_assigned_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4102, convert(varchar(255), @old_prot_appraiser_assigned_val), convert(varchar(255), @new_prot_appraiser_assigned_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_arb_assigned_val <> @new_prot_arb_assigned_val
          or
          ( @old_prot_arb_assigned_val is null and @new_prot_arb_assigned_val is not null ) 
          or
          ( @old_prot_arb_assigned_val is not null and @new_prot_arb_assigned_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_arb_assigned_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4103, convert(varchar(255), @old_prot_arb_assigned_val), convert(varchar(255), @new_prot_arb_assigned_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_val_type <> @new_prot_val_type
          or
          ( @old_prot_val_type is null and @new_prot_val_type is not null ) 
          or
          ( @old_prot_val_type is not null and @new_prot_val_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_val_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4151, convert(varchar(255), @old_prot_val_type), convert(varchar(255), @new_prot_val_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_arb_instructions <> @new_prot_arb_instructions
          or
          ( @old_prot_arb_instructions is null and @new_prot_arb_instructions is not null ) 
          or
          ( @old_prot_arb_instructions is not null and @new_prot_arb_instructions is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_arb_instructions' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4104, convert(varchar(255), @old_prot_arb_instructions), convert(varchar(255), @new_prot_arb_instructions), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_second_motion <> @new_prot_second_motion
          or
          ( @old_prot_second_motion is null and @new_prot_second_motion is not null ) 
          or
          ( @old_prot_second_motion is not null and @new_prot_second_motion is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_second_motion' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4130, convert(varchar(255), @old_prot_second_motion), convert(varchar(255), @new_prot_second_motion), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_second_motion_by <> @new_prot_second_motion_by
          or
          ( @old_prot_second_motion_by is null and @new_prot_second_motion_by is not null ) 
          or
          ( @old_prot_second_motion_by is not null and @new_prot_second_motion_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_second_motion_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4131, convert(varchar(255), @old_prot_second_motion_by), convert(varchar(255), @new_prot_second_motion_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_second_motion_seconded_by <> @new_prot_second_motion_seconded_by
          or
          ( @old_prot_second_motion_seconded_by is null and @new_prot_second_motion_seconded_by is not null ) 
          or
          ( @old_prot_second_motion_seconded_by is not null and @new_prot_second_motion_seconded_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_second_motion_seconded_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4135, convert(varchar(255), @old_prot_second_motion_seconded_by), convert(varchar(255), @new_prot_second_motion_seconded_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_second_motion_pass <> @new_prot_second_motion_pass
          or
          ( @old_prot_second_motion_pass is null and @new_prot_second_motion_pass is not null ) 
          or
          ( @old_prot_second_motion_pass is not null and @new_prot_second_motion_pass is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_second_motion_pass' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4134, convert(varchar(255), @old_prot_second_motion_pass), convert(varchar(255), @new_prot_second_motion_pass), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_second_motion_decision_cd <> @new_prot_second_motion_decision_cd
          or
          ( @old_prot_second_motion_decision_cd is null and @new_prot_second_motion_decision_cd is not null ) 
          or
          ( @old_prot_second_motion_decision_cd is not null and @new_prot_second_motion_decision_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_second_motion_decision_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4132, convert(varchar(255), @old_prot_second_motion_decision_cd), convert(varchar(255), @new_prot_second_motion_decision_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_second_motion_decision_dt <> @new_prot_second_motion_decision_dt
          or
          ( @old_prot_second_motion_decision_dt is null and @new_prot_second_motion_decision_dt is not null ) 
          or
          ( @old_prot_second_motion_decision_dt is not null and @new_prot_second_motion_decision_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_second_motion_decision_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4133, convert(varchar(255), @old_prot_second_motion_decision_dt), convert(varchar(255), @new_prot_second_motion_decision_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_other_motion <> @new_prot_other_motion
          or
          ( @old_prot_other_motion is null and @new_prot_other_motion is not null ) 
          or
          ( @old_prot_other_motion is not null and @new_prot_other_motion is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_other_motion' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4128, convert(varchar(255), @old_prot_other_motion), convert(varchar(255), @new_prot_other_motion), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_full_ratification_dt <> @new_prot_full_ratification_dt
          or
          ( @old_prot_full_ratification_dt is null and @new_prot_full_ratification_dt is not null ) 
          or
          ( @old_prot_full_ratification_dt is not null and @new_prot_full_ratification_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_full_ratification_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4121, convert(varchar(255), @old_prot_full_ratification_dt), convert(varchar(255), @new_prot_full_ratification_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_land_hstd_val <> @new_begin_land_hstd_val
          or
          ( @old_begin_land_hstd_val is null and @new_begin_land_hstd_val is not null ) 
          or
          ( @old_begin_land_hstd_val is not null and @new_begin_land_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_land_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 483, convert(varchar(255), @old_begin_land_hstd_val), convert(varchar(255), @new_begin_land_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_land_non_hstd_val <> @new_begin_land_non_hstd_val
          or
          ( @old_begin_land_non_hstd_val is null and @new_begin_land_non_hstd_val is not null ) 
          or
          ( @old_begin_land_non_hstd_val is not null and @new_begin_land_non_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_land_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 485, convert(varchar(255), @old_begin_land_non_hstd_val), convert(varchar(255), @new_begin_land_non_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_imprv_hstd_val <> @new_begin_imprv_hstd_val
          or
          ( @old_begin_imprv_hstd_val is null and @new_begin_imprv_hstd_val is not null ) 
          or
          ( @old_begin_imprv_hstd_val is not null and @new_begin_imprv_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_imprv_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 479, convert(varchar(255), @old_begin_imprv_hstd_val), convert(varchar(255), @new_begin_imprv_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_imprv_non_hstd_val <> @new_begin_imprv_non_hstd_val
          or
          ( @old_begin_imprv_non_hstd_val is null and @new_begin_imprv_non_hstd_val is not null ) 
          or
          ( @old_begin_imprv_non_hstd_val is not null and @new_begin_imprv_non_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_imprv_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 481, convert(varchar(255), @old_begin_imprv_non_hstd_val), convert(varchar(255), @new_begin_imprv_non_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_ag_use_val <> @new_begin_ag_use_val
          or
          ( @old_begin_ag_use_val is null and @new_begin_ag_use_val is not null ) 
          or
          ( @old_begin_ag_use_val is not null and @new_begin_ag_use_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_ag_use_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 467, convert(varchar(255), @old_begin_ag_use_val), convert(varchar(255), @new_begin_ag_use_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_ag_market <> @new_begin_ag_market
          or
          ( @old_begin_ag_market is null and @new_begin_ag_market is not null ) 
          or
          ( @old_begin_ag_market is not null and @new_begin_ag_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_ag_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 464, convert(varchar(255), @old_begin_ag_market), convert(varchar(255), @new_begin_ag_market), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_timber_use <> @new_begin_timber_use
          or
          ( @old_begin_timber_use is null and @new_begin_timber_use is not null ) 
          or
          ( @old_begin_timber_use is not null and @new_begin_timber_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_timber_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 494, convert(varchar(255), @old_begin_timber_use), convert(varchar(255), @new_begin_timber_use), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_timber_market <> @new_begin_timber_market
          or
          ( @old_begin_timber_market is null and @new_begin_timber_market is not null ) 
          or
          ( @old_begin_timber_market is not null and @new_begin_timber_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_timber_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 493, convert(varchar(255), @old_begin_timber_market), convert(varchar(255), @new_begin_timber_market), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_market <> @new_begin_market
          or
          ( @old_begin_market is null and @new_begin_market is not null ) 
          or
          ( @old_begin_market is not null and @new_begin_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 486, convert(varchar(255), @old_begin_market), convert(varchar(255), @new_begin_market), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_appraised_val <> @new_begin_appraised_val
          or
          ( @old_begin_appraised_val is null and @new_begin_appraised_val is not null ) 
          or
          ( @old_begin_appraised_val is not null and @new_begin_appraised_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_appraised_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 469, convert(varchar(255), @old_begin_appraised_val), convert(varchar(255), @new_begin_appraised_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_ten_percent_cap <> @new_begin_ten_percent_cap
          or
          ( @old_begin_ten_percent_cap is null and @new_begin_ten_percent_cap is not null ) 
          or
          ( @old_begin_ten_percent_cap is not null and @new_begin_ten_percent_cap is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_ten_percent_cap' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 490, convert(varchar(255), @old_begin_ten_percent_cap), convert(varchar(255), @new_begin_ten_percent_cap), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_assessed_val <> @new_begin_assessed_val
          or
          ( @old_begin_assessed_val is null and @new_begin_assessed_val is not null ) 
          or
          ( @old_begin_assessed_val is not null and @new_begin_assessed_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_assessed_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 471, convert(varchar(255), @old_begin_assessed_val), convert(varchar(255), @new_begin_assessed_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_rendered_val <> @new_begin_rendered_val
          or
          ( @old_begin_rendered_val is null and @new_begin_rendered_val is not null ) 
          or
          ( @old_begin_rendered_val is not null and @new_begin_rendered_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_rendered_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 489, convert(varchar(255), @old_begin_rendered_val), convert(varchar(255), @new_begin_rendered_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_exemptions <> @new_begin_exemptions
          or
          ( @old_begin_exemptions is null and @new_begin_exemptions is not null ) 
          or
          ( @old_begin_exemptions is not null and @new_begin_exemptions is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_exemptions' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 477, convert(varchar(255), @old_begin_exemptions), convert(varchar(255), @new_begin_exemptions), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_entities <> @new_begin_entities
          or
          ( @old_begin_entities is null and @new_begin_entities is not null ) 
          or
          ( @old_begin_entities is not null and @new_begin_entities is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_entities' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 476, convert(varchar(255), @old_begin_entities), convert(varchar(255), @new_begin_entities), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_begin_recalc_dt <> @new_begin_recalc_dt
          or
          ( @old_begin_recalc_dt is null and @new_begin_recalc_dt is not null ) 
          or
          ( @old_begin_recalc_dt is not null and @new_begin_recalc_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'begin_recalc_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 488, convert(varchar(255), @old_begin_recalc_dt), convert(varchar(255), @new_begin_recalc_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_land_hstd_val <> @new_final_land_hstd_val
          or
          ( @old_final_land_hstd_val is null and @new_final_land_hstd_val is not null ) 
          or
          ( @old_final_land_hstd_val is not null and @new_final_land_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_land_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1907, convert(varchar(255), @old_final_land_hstd_val), convert(varchar(255), @new_final_land_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_land_non_hstd_val <> @new_final_land_non_hstd_val
          or
          ( @old_final_land_non_hstd_val is null and @new_final_land_non_hstd_val is not null ) 
          or
          ( @old_final_land_non_hstd_val is not null and @new_final_land_non_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_land_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1908, convert(varchar(255), @old_final_land_non_hstd_val), convert(varchar(255), @new_final_land_non_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_imprv_hstd_val <> @new_final_imprv_hstd_val
          or
          ( @old_final_imprv_hstd_val is null and @new_final_imprv_hstd_val is not null ) 
          or
          ( @old_final_imprv_hstd_val is not null and @new_final_imprv_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_imprv_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1905, convert(varchar(255), @old_final_imprv_hstd_val), convert(varchar(255), @new_final_imprv_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_imprv_non_hstd_val <> @new_final_imprv_non_hstd_val
          or
          ( @old_final_imprv_non_hstd_val is null and @new_final_imprv_non_hstd_val is not null ) 
          or
          ( @old_final_imprv_non_hstd_val is not null and @new_final_imprv_non_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_imprv_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1906, convert(varchar(255), @old_final_imprv_non_hstd_val), convert(varchar(255), @new_final_imprv_non_hstd_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_ag_use_val <> @new_final_ag_use_val
          or
          ( @old_final_ag_use_val is null and @new_final_ag_use_val is not null ) 
          or
          ( @old_final_ag_use_val is not null and @new_final_ag_use_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_ag_use_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1900, convert(varchar(255), @old_final_ag_use_val), convert(varchar(255), @new_final_ag_use_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_ag_market <> @new_final_ag_market
          or
          ( @old_final_ag_market is null and @new_final_ag_market is not null ) 
          or
          ( @old_final_ag_market is not null and @new_final_ag_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_ag_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1899, convert(varchar(255), @old_final_ag_market), convert(varchar(255), @new_final_ag_market), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_timber_use <> @new_final_timber_use
          or
          ( @old_final_timber_use is null and @new_final_timber_use is not null ) 
          or
          ( @old_final_timber_use is not null and @new_final_timber_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_timber_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1914, convert(varchar(255), @old_final_timber_use), convert(varchar(255), @new_final_timber_use), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_timber_market <> @new_final_timber_market
          or
          ( @old_final_timber_market is null and @new_final_timber_market is not null ) 
          or
          ( @old_final_timber_market is not null and @new_final_timber_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_timber_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1913, convert(varchar(255), @old_final_timber_market), convert(varchar(255), @new_final_timber_market), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_market <> @new_final_market
          or
          ( @old_final_market is null and @new_final_market is not null ) 
          or
          ( @old_final_market is not null and @new_final_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1909, convert(varchar(255), @old_final_market), convert(varchar(255), @new_final_market), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_appraised_val <> @new_final_appraised_val
          or
          ( @old_final_appraised_val is null and @new_final_appraised_val is not null ) 
          or
          ( @old_final_appraised_val is not null and @new_final_appraised_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_appraised_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1901, convert(varchar(255), @old_final_appraised_val), convert(varchar(255), @new_final_appraised_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_ten_percent_cap <> @new_final_ten_percent_cap
          or
          ( @old_final_ten_percent_cap is null and @new_final_ten_percent_cap is not null ) 
          or
          ( @old_final_ten_percent_cap is not null and @new_final_ten_percent_cap is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_ten_percent_cap' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1912, convert(varchar(255), @old_final_ten_percent_cap), convert(varchar(255), @new_final_ten_percent_cap), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_assessed_val <> @new_final_assessed_val
          or
          ( @old_final_assessed_val is null and @new_final_assessed_val is not null ) 
          or
          ( @old_final_assessed_val is not null and @new_final_assessed_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_assessed_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1902, convert(varchar(255), @old_final_assessed_val), convert(varchar(255), @new_final_assessed_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_rendered_val <> @new_final_rendered_val
          or
          ( @old_final_rendered_val is null and @new_final_rendered_val is not null ) 
          or
          ( @old_final_rendered_val is not null and @new_final_rendered_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_rendered_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1911, convert(varchar(255), @old_final_rendered_val), convert(varchar(255), @new_final_rendered_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_exemptions <> @new_final_exemptions
          or
          ( @old_final_exemptions is null and @new_final_exemptions is not null ) 
          or
          ( @old_final_exemptions is not null and @new_final_exemptions is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_exemptions' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1904, convert(varchar(255), @old_final_exemptions), convert(varchar(255), @new_final_exemptions), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_entities <> @new_final_entities
          or
          ( @old_final_entities is null and @new_final_entities is not null ) 
          or
          ( @old_final_entities is not null and @new_final_entities is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_entities' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1903, convert(varchar(255), @old_final_entities), convert(varchar(255), @new_final_entities), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_final_recalc_dt <> @new_final_recalc_dt
          or
          ( @old_final_recalc_dt is null and @new_final_recalc_dt is not null ) 
          or
          ( @old_final_recalc_dt is not null and @new_final_recalc_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'final_recalc_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 1910, convert(varchar(255), @old_final_recalc_dt), convert(varchar(255), @new_final_recalc_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_bGridComplete <> @new_bGridComplete
          or
          ( @old_bGridComplete is null and @new_bGridComplete is not null ) 
          or
          ( @old_bGridComplete is not null and @new_bGridComplete is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'bGridComplete' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 497, convert(varchar(255), @old_bGridComplete), convert(varchar(255), @new_bGridComplete), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_closed_pacs_user_id <> @new_closed_pacs_user_id
          or
          ( @old_closed_pacs_user_id is null and @new_closed_pacs_user_id is not null ) 
          or
          ( @old_closed_pacs_user_id is not null and @new_closed_pacs_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'closed_pacs_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 771, convert(varchar(255), @old_closed_pacs_user_id), convert(varchar(255), @new_closed_pacs_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_bGenerateCompGrid <> @new_bGenerateCompGrid
          or
          ( @old_bGenerateCompGrid is null and @new_bGenerateCompGrid is not null ) 
          or
          ( @old_bGenerateCompGrid is not null and @new_bGenerateCompGrid is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'bGenerateCompGrid' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 496, convert(varchar(255), @old_bGenerateCompGrid), convert(varchar(255), @new_bGenerateCompGrid), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_status_date_changed <> @new_status_date_changed
          or
          ( @old_status_date_changed is null and @new_status_date_changed is not null ) 
          or
          ( @old_status_date_changed is not null and @new_status_date_changed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'status_date_changed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4950, convert(varchar(255), @old_status_date_changed), convert(varchar(255), @new_status_date_changed), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_status_changed_user_id <> @new_status_changed_user_id
          or
          ( @old_status_changed_user_id is null and @new_status_changed_user_id is not null ) 
          or
          ( @old_status_changed_user_id is not null and @new_status_changed_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'status_changed_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 4949, convert(varchar(255), @old_status_changed_user_id), convert(varchar(255), @new_status_changed_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_associated_inquiry <> @new_associated_inquiry
          or
          ( @old_associated_inquiry is null and @new_associated_inquiry is not null ) 
          or
          ( @old_associated_inquiry is not null and @new_associated_inquiry is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'associated_inquiry' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 345, convert(varchar(255), @old_associated_inquiry), convert(varchar(255), @new_associated_inquiry), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_appraiser_meeting_id <> @new_appraiser_meeting_id
          or
          ( @old_appraiser_meeting_id is null and @new_appraiser_meeting_id is not null ) 
          or
          ( @old_appraiser_meeting_id is not null and @new_appraiser_meeting_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'appraiser_meeting_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 253, convert(varchar(255), @old_appraiser_meeting_id), convert(varchar(255), @new_appraiser_meeting_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_appraiser_meeting_appraiser_id <> @new_appraiser_meeting_appraiser_id
          or
          ( @old_appraiser_meeting_appraiser_id is null and @new_appraiser_meeting_appraiser_id is not null ) 
          or
          ( @old_appraiser_meeting_appraiser_id is not null and @new_appraiser_meeting_appraiser_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'appraiser_meeting_appraiser_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 251, convert(varchar(255), @old_appraiser_meeting_appraiser_id), convert(varchar(255), @new_appraiser_meeting_appraiser_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_appraiser_meeting_date_time <> @new_appraiser_meeting_date_time
          or
          ( @old_appraiser_meeting_date_time is null and @new_appraiser_meeting_date_time is not null ) 
          or
          ( @old_appraiser_meeting_date_time is not null and @new_appraiser_meeting_date_time is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'appraiser_meeting_date_time' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 252, convert(varchar(255), @old_appraiser_meeting_date_time), convert(varchar(255), @new_appraiser_meeting_date_time), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_appraiser_meeting_appraiser_comments <> @new_appraiser_meeting_appraiser_comments
          or
          ( @old_appraiser_meeting_appraiser_comments is null and @new_appraiser_meeting_appraiser_comments is not null ) 
          or
          ( @old_appraiser_meeting_appraiser_comments is not null and @new_appraiser_meeting_appraiser_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'appraiser_meeting_appraiser_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 250, convert(varchar(255), @old_appraiser_meeting_appraiser_comments), convert(varchar(255), @new_appraiser_meeting_appraiser_comments), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_appraiser_meeting_taxpayer_comments <> @new_appraiser_meeting_taxpayer_comments
          or
          ( @old_appraiser_meeting_taxpayer_comments is null and @new_appraiser_meeting_taxpayer_comments is not null ) 
          or
          ( @old_appraiser_meeting_taxpayer_comments is not null and @new_appraiser_meeting_taxpayer_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'appraiser_meeting_taxpayer_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 254, convert(varchar(255), @old_appraiser_meeting_taxpayer_comments), convert(varchar(255), @new_appraiser_meeting_taxpayer_comments), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_appr_meeting_arrived_dt <> @new_prot_appr_meeting_arrived_dt
          or
          ( @old_prot_appr_meeting_arrived_dt is null and @new_prot_appr_meeting_arrived_dt is not null ) 
          or
          ( @old_prot_appr_meeting_arrived_dt is not null and @new_prot_appr_meeting_arrived_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_appr_meeting_arrived_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 6111, convert(varchar(255), @old_prot_appr_meeting_arrived_dt), convert(varchar(255), @new_prot_appr_meeting_arrived_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_prot_appr_docket_id <> @new_prot_appr_docket_id
          or
          ( @old_prot_appr_docket_id is null and @new_prot_appr_docket_id is not null ) 
          or
          ( @old_prot_appr_docket_id is not null and @new_prot_appr_docket_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'prot_appr_docket_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 6110, convert(varchar(255), @old_prot_appr_docket_id), convert(varchar(255), @new_prot_appr_docket_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_case_prepared <> @new_case_prepared
          or
          ( @old_case_prepared is null and @new_case_prepared is not null ) 
          or
          ( @old_case_prepared is not null and @new_case_prepared is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'case_prepared' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 9051, convert(varchar(255), @old_case_prepared), convert(varchar(255), @new_case_prepared), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_opinion_of_value <> @new_opinion_of_value
          or
          ( @old_opinion_of_value is null and @new_opinion_of_value is not null ) 
          or
          ( @old_opinion_of_value is not null and @new_opinion_of_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'opinion_of_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 3411, convert(varchar(255), @old_opinion_of_value), convert(varchar(255), @new_opinion_of_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_decision_reason_cd <> @new_decision_reason_cd
          or
          ( @old_decision_reason_cd is null and @new_decision_reason_cd is not null ) 
          or
          ( @old_decision_reason_cd is not null and @new_decision_reason_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'decision_reason_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 9309, convert(varchar(255), @old_decision_reason_cd), convert(varchar(255), @new_decision_reason_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
     
      if (
          @old_highly_disputed_property <> @new_highly_disputed_property
          or
          ( @old_highly_disputed_property is null and @new_highly_disputed_property is not null ) 
          or
          ( @old_highly_disputed_property is not null and @new_highly_disputed_property is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest' and
                    chg_log_columns = 'highly_disputed_property' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 23, 9959, convert(varchar(255), @old_highly_disputed_property), convert(varchar(255), @new_highly_disputed_property), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
 
     fetch next from curRows into 
		@old_prop_id, @old_prop_val_yr, @old_case_id, @old_prot_create_dt, @old_prot_complete_dt, @old_prot_type, @old_prot_status, @old_prot_taxpayer_doc_requested, @old_prot_taxpayer_doc_recorded_dt, @old_prot_taxpayer_evidence_requested, @old_prot_taxpayer_evidence_requested_dt, @old_prot_taxpayer_evidence_delivered_dt, @old_prot_taxpayer_evidence_staff, @old_prot_taxpayer_additional_evidence, @old_prot_taxpayer_evidence_waiver, @old_prot_taxes_paid, @old_prot_taxes_paid_verified_staff_id, @old_prot_taxes_paid_verified_dt, @old_prot_appraisal_staff, @old_prot_comments, @old_prot_affidavit_testimony_dt, @old_prot_affidavit_testimony_by, @old_prot_affidavit_testimony_received, @old_docket_id, @old_prot_assigned_panel, @old_prot_arrived_dt, @old_prot_hearing_rescheduled, @old_prot_packet_printed_dt, @old_prot_full_board_hearing, @old_prot_hearing_appraisal_staff, @old_prot_hearing_start_dt, @old_prot_hearing_finished_dt, @old_prot_hearing_recorder_id, @old_prot_taxpayer_comments, @old_prot_district_comments, @old_prot_first_motion, @old_prot_sustain_district_val, @old_prot_first_motion_by, @old_prot_first_motion_seconded_by, @old_prot_first_motion_pass, @old_prot_first_motion_decision_cd, @old_prot_first_motion_decision_dt, @old_prot_appraiser_assigned_val, @old_prot_arb_assigned_val, @old_prot_val_type, @old_prot_arb_instructions, @old_prot_second_motion, @old_prot_second_motion_by, @old_prot_second_motion_seconded_by, @old_prot_second_motion_pass, @old_prot_second_motion_decision_cd, @old_prot_second_motion_decision_dt, @old_prot_other_motion, @old_prot_full_ratification_dt, @old_begin_land_hstd_val, @old_begin_land_non_hstd_val, @old_begin_imprv_hstd_val, @old_begin_imprv_non_hstd_val, @old_begin_ag_use_val, @old_begin_ag_market, @old_begin_timber_use, @old_begin_timber_market, @old_begin_market, @old_begin_appraised_val, @old_begin_ten_percent_cap, @old_begin_assessed_val, @old_begin_rendered_val, @old_begin_exemptions, @old_begin_entities, @old_begin_recalc_dt, @old_final_land_hstd_val, @old_final_land_non_hstd_val, @old_final_imprv_hstd_val, @old_final_imprv_non_hstd_val, @old_final_ag_use_val, @old_final_ag_market, @old_final_timber_use, @old_final_timber_market, @old_final_market, @old_final_appraised_val, @old_final_ten_percent_cap, @old_final_assessed_val, @old_final_rendered_val, @old_final_exemptions, @old_final_entities, @old_final_recalc_dt, @old_bGridComplete, @old_closed_pacs_user_id, @old_bGenerateCompGrid, @old_status_date_changed, @old_status_changed_user_id, @old_associated_inquiry, @old_appraiser_meeting_id, @old_appraiser_meeting_appraiser_id, @old_appraiser_meeting_date_time, @old_appraiser_meeting_appraiser_comments, @old_appraiser_meeting_taxpayer_comments, @old_prot_appr_meeting_arrived_dt, @old_prot_appr_docket_id, @old_case_prepared, @old_opinion_of_value, @old_decision_reason_cd, @old_highly_disputed_property,
		@new_prop_id, @new_prop_val_yr, @new_case_id, @new_prot_create_dt, @new_prot_complete_dt, @new_prot_type, @new_prot_status, @new_prot_taxpayer_doc_requested, @new_prot_taxpayer_doc_recorded_dt, @new_prot_taxpayer_evidence_requested, @new_prot_taxpayer_evidence_requested_dt, @new_prot_taxpayer_evidence_delivered_dt, @new_prot_taxpayer_evidence_staff, @new_prot_taxpayer_additional_evidence, @new_prot_taxpayer_evidence_waiver, @new_prot_taxes_paid, @new_prot_taxes_paid_verified_staff_id, @new_prot_taxes_paid_verified_dt, @new_prot_appraisal_staff, @new_prot_comments, @new_prot_affidavit_testimony_dt, @new_prot_affidavit_testimony_by, @new_prot_affidavit_testimony_received, @new_docket_id, @new_prot_assigned_panel, @new_prot_arrived_dt, @new_prot_hearing_rescheduled, @new_prot_packet_printed_dt, @new_prot_full_board_hearing, @new_prot_hearing_appraisal_staff, @new_prot_hearing_start_dt, @new_prot_hearing_finished_dt, @new_prot_hearing_recorder_id, @new_prot_taxpayer_comments, @new_prot_district_comments, @new_prot_first_motion, @new_prot_sustain_district_val, @new_prot_first_motion_by, @new_prot_first_motion_seconded_by, @new_prot_first_motion_pass, @new_prot_first_motion_decision_cd, @new_prot_first_motion_decision_dt, @new_prot_appraiser_assigned_val, @new_prot_arb_assigned_val, @new_prot_val_type, @new_prot_arb_instructions, @new_prot_second_motion, @new_prot_second_motion_by, @new_prot_second_motion_seconded_by, @new_prot_second_motion_pass, @new_prot_second_motion_decision_cd, @new_prot_second_motion_decision_dt, @new_prot_other_motion, @new_prot_full_ratification_dt, @new_begin_land_hstd_val, @new_begin_land_non_hstd_val, @new_begin_imprv_hstd_val, @new_begin_imprv_non_hstd_val, @new_begin_ag_use_val, @new_begin_ag_market, @new_begin_timber_use, @new_begin_timber_market, @new_begin_market, @new_begin_appraised_val, @new_begin_ten_percent_cap, @new_begin_assessed_val, @new_begin_rendered_val, @new_begin_exemptions, @new_begin_entities, @new_begin_recalc_dt, @new_final_land_hstd_val, @new_final_land_non_hstd_val, @new_final_imprv_hstd_val, @new_final_imprv_non_hstd_val, @new_final_ag_use_val, @new_final_ag_market, @new_final_timber_use, @new_final_timber_market, @new_final_market, @new_final_appraised_val, @new_final_ten_percent_cap, @new_final_assessed_val, @new_final_rendered_val, @new_final_exemptions, @new_final_entities, @new_final_recalc_dt, @new_bGridComplete, @new_closed_pacs_user_id, @new_bGenerateCompGrid, @new_status_date_changed, @new_status_changed_user_id, @new_associated_inquiry, @new_appraiser_meeting_id, @new_appraiser_meeting_appraiser_id, @new_appraiser_meeting_date_time, @new_appraiser_meeting_appraiser_comments, @new_appraiser_meeting_taxpayer_comments, @new_prot_appr_meeting_arrived_dt, @new_prot_appr_docket_id, @new_case_prepared, @new_opinion_of_value, @new_decision_reason_cd, @new_highly_disputed_property
end
 
close curRows
deallocate curRows

GO


create trigger tr__arb_protest_insert_ChangeLog
on _arb_protest
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
 
declare @prop_id int
declare @prop_val_yr numeric(4,0)
declare @case_id int
declare @prot_create_dt datetime
declare @prot_complete_dt datetime
declare @prot_type varchar(10)
declare @prot_status varchar(10)
declare @prot_taxpayer_doc_requested char(1)
declare @prot_taxpayer_doc_recorded_dt datetime
declare @prot_taxpayer_evidence_requested char(1)
declare @prot_taxpayer_evidence_requested_dt datetime
declare @prot_taxpayer_evidence_delivered_dt datetime
declare @prot_taxpayer_evidence_staff int
declare @prot_taxpayer_additional_evidence char(1)
declare @prot_taxpayer_evidence_waiver char(1)
declare @prot_taxes_paid char(1)
declare @prot_taxes_paid_verified_staff_id int
declare @prot_taxes_paid_verified_dt datetime
declare @prot_appraisal_staff int
declare @prot_comments varchar(1024)
declare @prot_affidavit_testimony_dt datetime
declare @prot_affidavit_testimony_by varchar(10)
declare @prot_affidavit_testimony_received varchar(10)
declare @docket_id int
declare @prot_assigned_panel varchar(10)
declare @prot_arrived_dt datetime
declare @prot_hearing_rescheduled char(1)
declare @prot_packet_printed_dt datetime
declare @prot_full_board_hearing char(1)
declare @prot_hearing_appraisal_staff int
declare @prot_hearing_start_dt datetime
declare @prot_hearing_finished_dt datetime
declare @prot_hearing_recorder_id int
declare @prot_taxpayer_comments varchar(1024)
declare @prot_district_comments varchar(1024)
declare @prot_first_motion varchar(500)
declare @prot_sustain_district_val char(1)
declare @prot_first_motion_by varchar(10)
declare @prot_first_motion_seconded_by varchar(10)
declare @prot_first_motion_pass char(1)
declare @prot_first_motion_decision_cd varchar(10)
declare @prot_first_motion_decision_dt datetime
declare @prot_appraiser_assigned_val numeric(14,0)
declare @prot_arb_assigned_val numeric(14,0)
declare @prot_val_type char(1)
declare @prot_arb_instructions varchar(500)
declare @prot_second_motion varchar(500)
declare @prot_second_motion_by varchar(10)
declare @prot_second_motion_seconded_by varchar(10)
declare @prot_second_motion_pass char(1)
declare @prot_second_motion_decision_cd varchar(10)
declare @prot_second_motion_decision_dt datetime
declare @prot_other_motion varchar(500)
declare @prot_full_ratification_dt datetime
declare @begin_land_hstd_val numeric(14,0)
declare @begin_land_non_hstd_val numeric(14,0)
declare @begin_imprv_hstd_val numeric(14,0)
declare @begin_imprv_non_hstd_val numeric(14,0)
declare @begin_ag_use_val numeric(14,0)
declare @begin_ag_market numeric(14,0)
declare @begin_timber_use numeric(14,0)
declare @begin_timber_market numeric(14,0)
declare @begin_market numeric(14,0)
declare @begin_appraised_val numeric(14,0)
declare @begin_ten_percent_cap numeric(14,0)
declare @begin_assessed_val numeric(14,0)
declare @begin_rendered_val numeric(14,0)
declare @begin_exemptions varchar(50)
declare @begin_entities varchar(50)
declare @begin_recalc_dt datetime
declare @final_land_hstd_val numeric(14,0)
declare @final_land_non_hstd_val numeric(14,0)
declare @final_imprv_hstd_val numeric(14,0)
declare @final_imprv_non_hstd_val numeric(14,0)
declare @final_ag_use_val numeric(14,0)
declare @final_ag_market numeric(14,0)
declare @final_timber_use numeric(14,0)
declare @final_timber_market numeric(14,0)
declare @final_market numeric(14,0)
declare @final_appraised_val numeric(14,0)
declare @final_ten_percent_cap numeric(14,0)
declare @final_assessed_val numeric(14,0)
declare @final_rendered_val numeric(14,0)
declare @final_exemptions varchar(50)
declare @final_entities varchar(50)
declare @final_recalc_dt datetime
declare @bGridComplete bit
declare @closed_pacs_user_id int
declare @bGenerateCompGrid bit
declare @status_date_changed datetime
declare @status_changed_user_id int
declare @associated_inquiry int
declare @appraiser_meeting_id int
declare @appraiser_meeting_appraiser_id int
declare @appraiser_meeting_date_time datetime
declare @appraiser_meeting_appraiser_comments varchar(1024)
declare @appraiser_meeting_taxpayer_comments varchar(1024)
declare @prot_appr_meeting_arrived_dt datetime
declare @prot_appr_docket_id int
declare @case_prepared bit
declare @opinion_of_value numeric(14,0)
declare @decision_reason_cd varchar(10)
 
declare curRows cursor
for
     select prop_id, prop_val_yr, case_id, prot_create_dt, prot_complete_dt, prot_type, prot_status, prot_taxpayer_doc_requested, prot_taxpayer_doc_recorded_dt, prot_taxpayer_evidence_requested, prot_taxpayer_evidence_requested_dt, prot_taxpayer_evidence_delivered_dt, prot_taxpayer_evidence_staff, prot_taxpayer_additional_evidence, prot_taxpayer_evidence_waiver, prot_taxes_paid, prot_taxes_paid_verified_staff_id, prot_taxes_paid_verified_dt, prot_appraisal_staff, prot_comments, prot_affidavit_testimony_dt, prot_affidavit_testimony_by, prot_affidavit_testimony_received, docket_id, prot_assigned_panel, prot_arrived_dt, prot_hearing_rescheduled, prot_packet_printed_dt, prot_full_board_hearing, prot_hearing_appraisal_staff, prot_hearing_start_dt, prot_hearing_finished_dt, prot_hearing_recorder_id, prot_taxpayer_comments, prot_district_comments, prot_first_motion, prot_sustain_district_val, prot_first_motion_by, prot_first_motion_seconded_by, prot_first_motion_pass, prot_first_motion_decision_cd, prot_first_motion_decision_dt, prot_appraiser_assigned_val, prot_arb_assigned_val, prot_val_type, prot_arb_instructions, prot_second_motion, prot_second_motion_by, prot_second_motion_seconded_by, prot_second_motion_pass, prot_second_motion_decision_cd, prot_second_motion_decision_dt, prot_other_motion, prot_full_ratification_dt, begin_land_hstd_val, begin_land_non_hstd_val, begin_imprv_hstd_val, begin_imprv_non_hstd_val, begin_ag_use_val, begin_ag_market, begin_timber_use, begin_timber_market, begin_market, begin_appraised_val, begin_ten_percent_cap, begin_assessed_val, begin_rendered_val, begin_exemptions, begin_entities, begin_recalc_dt, final_land_hstd_val, final_land_non_hstd_val, final_imprv_hstd_val, final_imprv_non_hstd_val, final_ag_use_val, final_ag_market, final_timber_use, final_timber_market, final_market, final_appraised_val, final_ten_percent_cap, final_assessed_val, final_rendered_val, final_exemptions, final_entities, final_recalc_dt, bGridComplete, closed_pacs_user_id, bGenerateCompGrid, status_date_changed, status_changed_user_id, associated_inquiry, appraiser_meeting_id, appraiser_meeting_appraiser_id, appraiser_meeting_date_time, appraiser_meeting_appraiser_comments, appraiser_meeting_taxpayer_comments, prot_appr_meeting_arrived_dt, prot_appr_docket_id, case_prepared, opinion_of_value, decision_reason_cd from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @prot_create_dt, @prot_complete_dt, @prot_type, @prot_status, @prot_taxpayer_doc_requested, @prot_taxpayer_doc_recorded_dt, @prot_taxpayer_evidence_requested, @prot_taxpayer_evidence_requested_dt, @prot_taxpayer_evidence_delivered_dt, @prot_taxpayer_evidence_staff, @prot_taxpayer_additional_evidence, @prot_taxpayer_evidence_waiver, @prot_taxes_paid, @prot_taxes_paid_verified_staff_id, @prot_taxes_paid_verified_dt, @prot_appraisal_staff, @prot_comments, @prot_affidavit_testimony_dt, @prot_affidavit_testimony_by, @prot_affidavit_testimony_received, @docket_id, @prot_assigned_panel, @prot_arrived_dt, @prot_hearing_rescheduled, @prot_packet_printed_dt, @prot_full_board_hearing, @prot_hearing_appraisal_staff, @prot_hearing_start_dt, @prot_hearing_finished_dt, @prot_hearing_recorder_id, @prot_taxpayer_comments, @prot_district_comments, @prot_first_motion, @prot_sustain_district_val, @prot_first_motion_by, @prot_first_motion_seconded_by, @prot_first_motion_pass, @prot_first_motion_decision_cd, @prot_first_motion_decision_dt, @prot_appraiser_assigned_val, @prot_arb_assigned_val, @prot_val_type, @prot_arb_instructions, @prot_second_motion, @prot_second_motion_by, @prot_second_motion_seconded_by, @prot_second_motion_pass, @prot_second_motion_decision_cd, @prot_second_motion_decision_dt, @prot_other_motion, @prot_full_ratification_dt, @begin_land_hstd_val, @begin_land_non_hstd_val, @begin_imprv_hstd_val, @begin_imprv_non_hstd_val, @begin_ag_use_val, @begin_ag_market, @begin_timber_use, @begin_timber_market, @begin_market, @begin_appraised_val, @begin_ten_percent_cap, @begin_assessed_val, @begin_rendered_val, @begin_exemptions, @begin_entities, @begin_recalc_dt, @final_land_hstd_val, @final_land_non_hstd_val, @final_imprv_hstd_val, @final_imprv_non_hstd_val, @final_ag_use_val, @final_ag_market, @final_timber_use, @final_timber_market, @final_market, @final_appraised_val, @final_ten_percent_cap, @final_assessed_val, @final_rendered_val, @final_exemptions, @final_entities, @final_recalc_dt, @bGridComplete, @closed_pacs_user_id, @bGenerateCompGrid, @status_date_changed, @status_changed_user_id, @associated_inquiry, @appraiser_meeting_id, @appraiser_meeting_appraiser_id, @appraiser_meeting_date_time, @appraiser_meeting_appraiser_comments, @appraiser_meeting_taxpayer_comments, @prot_appr_meeting_arrived_dt, @prot_appr_docket_id, @case_prepared, @opinion_of_value, @decision_reason_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @case_id) + '-' + convert(varchar(4), @prop_val_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'case_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 612, null, convert(varchar(255), @case_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_create_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4112, null, convert(varchar(255), @prot_create_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_complete_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4111, null, convert(varchar(255), @prot_complete_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4150, null, convert(varchar(255), @prot_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4136, null, convert(varchar(255), @prot_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_doc_requested' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4144, null, convert(varchar(255), @prot_taxpayer_doc_requested), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_doc_recorded_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4143, null, convert(varchar(255), @prot_taxpayer_doc_recorded_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_evidence_requested' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4146, null, convert(varchar(255), @prot_taxpayer_evidence_requested), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_evidence_requested_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4147, null, convert(varchar(255), @prot_taxpayer_evidence_requested_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_evidence_delivered_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4145, null, convert(varchar(255), @prot_taxpayer_evidence_delivered_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_evidence_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4148, null, convert(varchar(255), @prot_taxpayer_evidence_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_additional_evidence' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4141, null, convert(varchar(255), @prot_taxpayer_additional_evidence), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_evidence_waiver' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4149, null, convert(varchar(255), @prot_taxpayer_evidence_waiver), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxes_paid' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4138, null, convert(varchar(255), @prot_taxes_paid), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxes_paid_verified_staff_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4140, null, convert(varchar(255), @prot_taxes_paid_verified_staff_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxes_paid_verified_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4139, null, convert(varchar(255), @prot_taxes_paid_verified_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_appraisal_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4101, null, convert(varchar(255), @prot_appraisal_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4110, null, convert(varchar(255), @prot_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_affidavit_testimony_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4099, null, convert(varchar(255), @prot_affidavit_testimony_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_affidavit_testimony_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4098, null, convert(varchar(255), @prot_affidavit_testimony_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_affidavit_testimony_received' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4100, null, convert(varchar(255), @prot_affidavit_testimony_received), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'docket_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1372, null, convert(varchar(255), @docket_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_assigned_panel' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4106, null, convert(varchar(255), @prot_assigned_panel), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_arrived_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4105, null, convert(varchar(255), @prot_arrived_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_hearing_rescheduled' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4125, null, convert(varchar(255), @prot_hearing_rescheduled), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_packet_printed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4129, null, convert(varchar(255), @prot_packet_printed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_full_board_hearing' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4120, null, convert(varchar(255), @prot_full_board_hearing), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_hearing_appraisal_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4122, null, convert(varchar(255), @prot_hearing_appraisal_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_hearing_start_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4126, null, convert(varchar(255), @prot_hearing_start_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_hearing_finished_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4123, null, convert(varchar(255), @prot_hearing_finished_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_hearing_recorder_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4124, null, convert(varchar(255), @prot_hearing_recorder_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_taxpayer_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4142, null, convert(varchar(255), @prot_taxpayer_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_district_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4113, null, convert(varchar(255), @prot_district_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_first_motion' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4114, null, convert(varchar(255), @prot_first_motion), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_sustain_district_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4137, null, convert(varchar(255), @prot_sustain_district_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_first_motion_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4115, null, convert(varchar(255), @prot_first_motion_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_first_motion_seconded_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4119, null, convert(varchar(255), @prot_first_motion_seconded_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_first_motion_pass' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4118, null, convert(varchar(255), @prot_first_motion_pass), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_first_motion_decision_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4116, null, convert(varchar(255), @prot_first_motion_decision_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_first_motion_decision_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4117, null, convert(varchar(255), @prot_first_motion_decision_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_appraiser_assigned_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4102, null, convert(varchar(255), @prot_appraiser_assigned_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_arb_assigned_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4103, null, convert(varchar(255), @prot_arb_assigned_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_val_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4151, null, convert(varchar(255), @prot_val_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_arb_instructions' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4104, null, convert(varchar(255), @prot_arb_instructions), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_second_motion' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4130, null, convert(varchar(255), @prot_second_motion), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_second_motion_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4131, null, convert(varchar(255), @prot_second_motion_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_second_motion_seconded_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4135, null, convert(varchar(255), @prot_second_motion_seconded_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_second_motion_pass' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4134, null, convert(varchar(255), @prot_second_motion_pass), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_second_motion_decision_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4132, null, convert(varchar(255), @prot_second_motion_decision_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_second_motion_decision_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4133, null, convert(varchar(255), @prot_second_motion_decision_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_other_motion' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4128, null, convert(varchar(255), @prot_other_motion), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_full_ratification_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4121, null, convert(varchar(255), @prot_full_ratification_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_land_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 483, null, convert(varchar(255), @begin_land_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_land_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 485, null, convert(varchar(255), @begin_land_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_imprv_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 479, null, convert(varchar(255), @begin_imprv_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_imprv_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 481, null, convert(varchar(255), @begin_imprv_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_ag_use_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 467, null, convert(varchar(255), @begin_ag_use_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_ag_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 464, null, convert(varchar(255), @begin_ag_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_timber_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 494, null, convert(varchar(255), @begin_timber_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_timber_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 493, null, convert(varchar(255), @begin_timber_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 486, null, convert(varchar(255), @begin_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_appraised_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 469, null, convert(varchar(255), @begin_appraised_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_ten_percent_cap' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 490, null, convert(varchar(255), @begin_ten_percent_cap), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_assessed_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 471, null, convert(varchar(255), @begin_assessed_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_rendered_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 489, null, convert(varchar(255), @begin_rendered_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_exemptions' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 477, null, convert(varchar(255), @begin_exemptions), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_entities' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 476, null, convert(varchar(255), @begin_entities), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'begin_recalc_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 488, null, convert(varchar(255), @begin_recalc_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_land_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1907, null, convert(varchar(255), @final_land_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_land_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1908, null, convert(varchar(255), @final_land_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_imprv_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1905, null, convert(varchar(255), @final_imprv_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_imprv_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1906, null, convert(varchar(255), @final_imprv_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_ag_use_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1900, null, convert(varchar(255), @final_ag_use_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_ag_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1899, null, convert(varchar(255), @final_ag_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_timber_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1914, null, convert(varchar(255), @final_timber_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_timber_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1913, null, convert(varchar(255), @final_timber_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1909, null, convert(varchar(255), @final_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_appraised_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1901, null, convert(varchar(255), @final_appraised_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_ten_percent_cap' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1912, null, convert(varchar(255), @final_ten_percent_cap), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_assessed_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1902, null, convert(varchar(255), @final_assessed_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_rendered_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1911, null, convert(varchar(255), @final_rendered_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_exemptions' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1904, null, convert(varchar(255), @final_exemptions), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_entities' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1903, null, convert(varchar(255), @final_entities), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'final_recalc_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 1910, null, convert(varchar(255), @final_recalc_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'bGridComplete' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 497, null, convert(varchar(255), @bGridComplete), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'closed_pacs_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 771, null, convert(varchar(255), @closed_pacs_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'bGenerateCompGrid' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 496, null, convert(varchar(255), @bGenerateCompGrid), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'status_date_changed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4950, null, convert(varchar(255), @status_date_changed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'status_changed_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 4949, null, convert(varchar(255), @status_changed_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'associated_inquiry' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 345, null, convert(varchar(255), @associated_inquiry), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'appraiser_meeting_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 253, null, convert(varchar(255), @appraiser_meeting_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'appraiser_meeting_appraiser_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 251, null, convert(varchar(255), @appraiser_meeting_appraiser_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'appraiser_meeting_date_time' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 252, null, convert(varchar(255), @appraiser_meeting_date_time), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'appraiser_meeting_appraiser_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 250, null, convert(varchar(255), @appraiser_meeting_appraiser_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'appraiser_meeting_taxpayer_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 254, null, convert(varchar(255), @appraiser_meeting_taxpayer_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_appr_meeting_arrived_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 6111, null, convert(varchar(255), @prot_appr_meeting_arrived_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'prot_appr_docket_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 6110, null, convert(varchar(255), @prot_appr_docket_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'case_prepared' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 9051, null, convert(varchar(255), @case_prepared), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'opinion_of_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 3411, null, convert(varchar(255), @opinion_of_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest' and
               chg_log_columns = 'decision_reason_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 23, 9309, null, convert(varchar(255), @decision_reason_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @prot_create_dt, @prot_complete_dt, @prot_type, @prot_status, @prot_taxpayer_doc_requested, @prot_taxpayer_doc_recorded_dt, @prot_taxpayer_evidence_requested, @prot_taxpayer_evidence_requested_dt, @prot_taxpayer_evidence_delivered_dt, @prot_taxpayer_evidence_staff, @prot_taxpayer_additional_evidence, @prot_taxpayer_evidence_waiver, @prot_taxes_paid, @prot_taxes_paid_verified_staff_id, @prot_taxes_paid_verified_dt, @prot_appraisal_staff, @prot_comments, @prot_affidavit_testimony_dt, @prot_affidavit_testimony_by, @prot_affidavit_testimony_received, @docket_id, @prot_assigned_panel, @prot_arrived_dt, @prot_hearing_rescheduled, @prot_packet_printed_dt, @prot_full_board_hearing, @prot_hearing_appraisal_staff, @prot_hearing_start_dt, @prot_hearing_finished_dt, @prot_hearing_recorder_id, @prot_taxpayer_comments, @prot_district_comments, @prot_first_motion, @prot_sustain_district_val, @prot_first_motion_by, @prot_first_motion_seconded_by, @prot_first_motion_pass, @prot_first_motion_decision_cd, @prot_first_motion_decision_dt, @prot_appraiser_assigned_val, @prot_arb_assigned_val, @prot_val_type, @prot_arb_instructions, @prot_second_motion, @prot_second_motion_by, @prot_second_motion_seconded_by, @prot_second_motion_pass, @prot_second_motion_decision_cd, @prot_second_motion_decision_dt, @prot_other_motion, @prot_full_ratification_dt, @begin_land_hstd_val, @begin_land_non_hstd_val, @begin_imprv_hstd_val, @begin_imprv_non_hstd_val, @begin_ag_use_val, @begin_ag_market, @begin_timber_use, @begin_timber_market, @begin_market, @begin_appraised_val, @begin_ten_percent_cap, @begin_assessed_val, @begin_rendered_val, @begin_exemptions, @begin_entities, @begin_recalc_dt, @final_land_hstd_val, @final_land_non_hstd_val, @final_imprv_hstd_val, @final_imprv_non_hstd_val, @final_ag_use_val, @final_ag_market, @final_timber_use, @final_timber_market, @final_market, @final_appraised_val, @final_ten_percent_cap, @final_assessed_val, @final_rendered_val, @final_exemptions, @final_entities, @final_recalc_dt, @bGridComplete, @closed_pacs_user_id, @bGenerateCompGrid, @status_date_changed, @status_changed_user_id, @associated_inquiry, @appraiser_meeting_id, @appraiser_meeting_appraiser_id, @appraiser_meeting_date_time, @appraiser_meeting_appraiser_comments, @appraiser_meeting_taxpayer_comments, @prot_appr_meeting_arrived_dt, @prot_appr_docket_id, @case_prepared, @opinion_of_value, @decision_reason_cd
end
 
close curRows
deallocate curRows

GO


create trigger tr__arb_protest_delete
	on _arb_protest
	for delete
as

set nocount on

	declare
		@lDocketID int,
		@lApprDocketID int,
		@szHearingType varchar(10)

	select
		@lDocketID = docket_id,
		@lApprDocketID = prot_appr_docket_id
	from deleted
	
	/* If the protest was scheduled */
	if ( @lDocketID is not null )
	begin
		/*
		update _arb_protest_hearing_docket with(rowlock) set
			scheduled_protest_count = scheduled_protest_count - 1
		where
			docket_id = @lDocketID
		*/

		/* Maintain the count of scheduled protests for the docket */
		update _arb_protest_hearing_docket with(rowlock) set
			scheduled_protest_count = (
				select count (arb.prop_id)
				from _arb_protest as arb with(nolock)
				where
					docket_id = @lDocketID
			)
		where
			docket_id = @lDocketID

		select
			@szHearingType = h.szHearingType
		from _arb_protest_hearing_docket as d
		join _arb_protest_hearing as h on
			d.lHearingID = h.lHearingID
		where
			d.docket_id = @lDocketID

		if ( @szHearingType = 'A' )
		begin
			/* Maintain the count of agents who have protests for the docket */
			update _arb_protest_hearing_docket with(rowlock) set
				scheduled_agent_count = (
					select count(distinct agent.agent_id)
					from _arb_protest as arb
					join agent on agent.arb_docket_id = @lDocketID
					where
						arb.docket_id = @lDocketID
				)
			where
				docket_id = @lDocketID
		end
	end

	/* If the appraiser was scheduled */
	if ( @lApprDocketID is not null )
	begin
		/* Maintain the count of scheduled protests for the docket */
		update _arb_protest_hearing_docket with(rowlock) set
			scheduled_protest_count =
			(
				select count( arb.prop_id)
				from _arb_protest as arb with(nolock)
				where prot_appr_docket_id = @lApprDocketID
			)
		where docket_id = @lApprDocketID
	end

set nocount off

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This column will be the appraisers assigned improvement value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'prot_appraiser_assigned_imprv_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin AG HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'begin_ag_hs_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final AG HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'final_ag_hs_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final appraised Non-Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'final_appraised_NonClassified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Highly Disputed Property Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'highly_disputed_property';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin appraised Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'begin_appraised_Classified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final timer HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'final_timber_hs_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final AG HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'final_ag_hs_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This colulmn will be the boes assigned land', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'prot_boe_assigned_land_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin timer HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'begin_timber_hs_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin AG HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'begin_ag_hs_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This column will be the appraisers assigned land value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'prot_appraiser_assigned_land_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin appraised Non-Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'begin_appraised_NonClassified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final appraised Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'final_appraised_Classified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This column will be the boes assigned improvement value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'prot_boe_assigned_imprv_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin timer HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'begin_timber_hs_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final timer HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest', @level2type = N'COLUMN', @level2name = N'final_timber_hs_use_val';


GO

