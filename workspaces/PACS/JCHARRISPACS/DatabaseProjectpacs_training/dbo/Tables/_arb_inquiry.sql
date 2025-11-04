CREATE TABLE [dbo].[_arb_inquiry] (
    [prop_id]                              INT            NOT NULL,
    [prop_val_yr]                          NUMERIC (4)    NOT NULL,
    [case_id]                              INT            NOT NULL,
    [inq_create_dt]                        DATETIME       NULL,
    [inq_complete_dt]                      DATETIME       NULL,
    [inq_operator]                         INT            NULL,
    [inq_type]                             VARCHAR (10)   NULL,
    [inq_status]                           VARCHAR (10)   NULL,
    [inq_nature]                           VARCHAR (10)   NULL,
    [inq_appraisal_staff]                  INT            NULL,
    [inq_appraisal_staff_dt]               DATETIME       NULL,
    [inq_support_staff]                    INT            NULL,
    [inq_support_staff_dt]                 DATETIME       NULL,
    [inq_gis_staff]                        INT            NULL,
    [inq_gis_staff_dt]                     DATETIME       NULL,
    [inq_field_check]                      CHAR (1)       NULL,
    [inq_field_staff]                      INT            NULL,
    [inq_field_staff_dt]                   DATETIME       NULL,
    [inq_field_check_completed_dt]         DATETIME       NULL,
    [inq_taxpayer_doc_requested]           CHAR (1)       NULL,
    [inq_taxpayer_doc_request_dt]          DATETIME       NULL,
    [inq_taxpayer_doc_expected_dt]         DATETIME       NULL,
    [inq_taxpayer_doc_received_dt]         DATETIME       NULL,
    [inq_taxpayer_doc_type]                VARCHAR (10)   NULL,
    [inq_value_agreement_amt]              NUMERIC (14)   NULL,
    [inq_value_agreement_mail_dt]          DATETIME       NULL,
    [inq_value_agreement_fax_dt]           DATETIME       NULL,
    [inq_value_agreement_received_dt]      DATETIME       NULL,
    [inq_by_type]                          VARCHAR (10)   NULL,
    [inq_by_id]                            INT            NULL,
    [inq_by_id_type]                       INT            NULL,
    [inq_assigned_val]                     NUMERIC (14)   NULL,
    [inq_assigned_reason_cd]               VARCHAR (10)   NULL,
    [inq_taxpayer_comments]                VARCHAR (1024) NULL,
    [inq_appraiser_comments]               VARCHAR (1024) NULL,
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
    [bGridComplete]                        BIT            CONSTRAINT [CDF__arb_inquiry_bGridComplete] DEFAULT (0) NOT NULL,
    [closed_pacs_user_id]                  INT            NULL,
    [bGenerateCompGrid]                    BIT            CONSTRAINT [CDF__arb_inquiry_bGenerateCompGrid] DEFAULT (1) NOT NULL,
    [status_date_changed]                  DATETIME       NULL,
    [status_changed_user_id]               INT            NULL,
    [associated_protest]                   INT            NULL,
    [appraiser_meeting_id]                 INT            NULL,
    [appraiser_meeting_appraiser_id]       INT            NULL,
    [appraiser_meeting_date_time]          DATETIME       NULL,
    [appraiser_meeting_appraiser_comments] VARCHAR (1024) NULL,
    [appraiser_meeting_taxpayer_comments]  VARCHAR (1024) NULL,
    [inq_operator_comments]                VARCHAR (1024) NULL,
    [inq_appraisal_staff2]                 INT            NULL,
    [inq_appraisal_staff2_dt]              DATETIME       NULL,
    [inq_additional_status]                VARCHAR (10)   NULL,
    [inq_recheck_dt]                       DATETIME       CONSTRAINT [CDF__arb_inquiry_inq_recheck_dt] DEFAULT ((0)) NULL,
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
    CONSTRAINT [CPK__arb_inquiry] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_inquiry_appraiser_meeting_appraiser_id] FOREIGN KEY ([appraiser_meeting_appraiser_id]) REFERENCES [dbo].[appraiser] ([appraiser_id]),
    CONSTRAINT [CFK__arb_inquiry_inq_additional_status] FOREIGN KEY ([inq_additional_status]) REFERENCES [dbo].[_arb_inquiry_additional_status] ([status_cd]),
    CONSTRAINT [CFK__arb_inquiry_inq_assigned_reason_cd] FOREIGN KEY ([inq_assigned_reason_cd]) REFERENCES [dbo].[_arb_inquiry_value_reason] ([assigned_value_reason_cd]),
    CONSTRAINT [CFK__arb_inquiry_inq_by_type] FOREIGN KEY ([inq_by_type]) REFERENCES [dbo].[_arb_inquiry_by] ([inquiry_by_cd]),
    CONSTRAINT [CFK__arb_inquiry_inq_gis_staff] FOREIGN KEY ([inq_gis_staff]) REFERENCES [dbo].[gis_staff] ([id]),
    CONSTRAINT [CFK__arb_inquiry_inq_nature] FOREIGN KEY ([inq_nature]) REFERENCES [dbo].[_arb_inquiry_nature] ([inquiry_nature_cd]),
    CONSTRAINT [CFK__arb_inquiry_inq_status] FOREIGN KEY ([inq_status]) REFERENCES [dbo].[_arb_inquiry_status] ([status_cd]),
    CONSTRAINT [CFK__arb_inquiry_inq_support_staff] FOREIGN KEY ([inq_support_staff]) REFERENCES [dbo].[support_staff] ([id]),
    CONSTRAINT [CFK__arb_inquiry_inq_taxpayer_doc_type] FOREIGN KEY ([inq_taxpayer_doc_type]) REFERENCES [dbo].[_arb_inquiry_taxpayer_doc_type] ([taxpayer_doc_type_cd]),
    CONSTRAINT [CFK__arb_inquiry_inq_type] FOREIGN KEY ([inq_type]) REFERENCES [dbo].[_arb_inquiry_type] ([inquiry_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_associated_protest]
    ON [dbo].[_arb_inquiry]([associated_protest] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr__arb_inquiry_update_ChangeLog
on _arb_inquiry
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
select @tvar_lFutureYear = future_yr
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
declare @old_inq_create_dt datetime
declare @new_inq_create_dt datetime
declare @old_inq_complete_dt datetime
declare @new_inq_complete_dt datetime
declare @old_inq_operator int
declare @new_inq_operator int
declare @old_inq_type varchar(10)
declare @new_inq_type varchar(10)
declare @old_inq_status varchar(10)
declare @new_inq_status varchar(10)
declare @old_inq_nature varchar(10)
declare @new_inq_nature varchar(10)
declare @old_inq_appraisal_staff int
declare @new_inq_appraisal_staff int
declare @old_inq_appraisal_staff_dt datetime
declare @new_inq_appraisal_staff_dt datetime
declare @old_inq_support_staff int
declare @new_inq_support_staff int
declare @old_inq_support_staff_dt datetime
declare @new_inq_support_staff_dt datetime
declare @old_inq_gis_staff int
declare @new_inq_gis_staff int
declare @old_inq_gis_staff_dt datetime
declare @new_inq_gis_staff_dt datetime
declare @old_inq_field_check char(1)
declare @new_inq_field_check char(1)
declare @old_inq_field_staff int
declare @new_inq_field_staff int
declare @old_inq_field_staff_dt datetime
declare @new_inq_field_staff_dt datetime
declare @old_inq_field_check_completed_dt datetime
declare @new_inq_field_check_completed_dt datetime
declare @old_inq_taxpayer_doc_requested char(1)
declare @new_inq_taxpayer_doc_requested char(1)
declare @old_inq_taxpayer_doc_request_dt datetime
declare @new_inq_taxpayer_doc_request_dt datetime
declare @old_inq_taxpayer_doc_expected_dt datetime
declare @new_inq_taxpayer_doc_expected_dt datetime
declare @old_inq_taxpayer_doc_received_dt datetime
declare @new_inq_taxpayer_doc_received_dt datetime
declare @old_inq_taxpayer_doc_type varchar(10)
declare @new_inq_taxpayer_doc_type varchar(10)
declare @old_inq_value_agreement_amt numeric(14,0)
declare @new_inq_value_agreement_amt numeric(14,0)
declare @old_inq_value_agreement_mail_dt datetime
declare @new_inq_value_agreement_mail_dt datetime
declare @old_inq_value_agreement_fax_dt datetime
declare @new_inq_value_agreement_fax_dt datetime
declare @old_inq_value_agreement_received_dt datetime
declare @new_inq_value_agreement_received_dt datetime
declare @old_inq_by_type varchar(10)
declare @new_inq_by_type varchar(10)
declare @old_inq_by_id int
declare @new_inq_by_id int
declare @old_inq_by_id_type int
declare @new_inq_by_id_type int
declare @old_inq_assigned_val numeric(14,0)
declare @new_inq_assigned_val numeric(14,0)
declare @old_inq_assigned_reason_cd varchar(10)
declare @new_inq_assigned_reason_cd varchar(10)
declare @old_inq_taxpayer_comments varchar(1024)
declare @new_inq_taxpayer_comments varchar(1024)
declare @old_inq_appraiser_comments varchar(1024)
declare @new_inq_appraiser_comments varchar(1024)
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
declare @old_associated_protest int
declare @new_associated_protest int
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
declare @old_inq_operator_comments varchar(1024)
declare @new_inq_operator_comments varchar(1024)
 
declare curRows cursor
for
     select d.prop_id, d.prop_val_yr, d.case_id, d.inq_create_dt, d.inq_complete_dt, d.inq_operator, d.inq_type, d.inq_status, d.inq_nature, d.inq_appraisal_staff, d.inq_appraisal_staff_dt, d.inq_support_staff, d.inq_support_staff_dt, d.inq_gis_staff, d.inq_gis_staff_dt, d.inq_field_check, d.inq_field_staff, d.inq_field_staff_dt, d.inq_field_check_completed_dt, d.inq_taxpayer_doc_requested, d.inq_taxpayer_doc_request_dt, d.inq_taxpayer_doc_expected_dt, d.inq_taxpayer_doc_received_dt, d.inq_taxpayer_doc_type, d.inq_value_agreement_amt, d.inq_value_agreement_mail_dt, d.inq_value_agreement_fax_dt, d.inq_value_agreement_received_dt, d.inq_by_type, d.inq_by_id, d.inq_by_id_type, d.inq_assigned_val, d.inq_assigned_reason_cd, d.inq_taxpayer_comments, d.inq_appraiser_comments, d.begin_land_hstd_val, d.begin_land_non_hstd_val, d.begin_imprv_hstd_val, d.begin_imprv_non_hstd_val, d.begin_ag_use_val, d.begin_ag_market, d.begin_timber_use, d.begin_timber_market, d.begin_market, d.begin_appraised_val, d.begin_ten_percent_cap, d.begin_assessed_val, d.begin_rendered_val, d.begin_exemptions, d.begin_entities, d.begin_recalc_dt, d.final_land_hstd_val, d.final_land_non_hstd_val, d.final_imprv_hstd_val, d.final_imprv_non_hstd_val, d.final_ag_use_val, d.final_ag_market, d.final_timber_use, d.final_timber_market, d.final_market, d.final_appraised_val, d.final_ten_percent_cap, d.final_assessed_val, d.final_rendered_val, d.final_exemptions, d.final_entities, d.final_recalc_dt, d.bGridComplete, d.closed_pacs_user_id, d.bGenerateCompGrid, d.status_date_changed, d.status_changed_user_id, d.associated_protest, d.appraiser_meeting_id, d.appraiser_meeting_appraiser_id, d.appraiser_meeting_date_time, d.appraiser_meeting_appraiser_comments, d.appraiser_meeting_taxpayer_comments, d.inq_operator_comments, i.prop_id, i.prop_val_yr, i.case_id, i.inq_create_dt, i.inq_complete_dt, i.inq_operator, i.inq_type, i.inq_status, i.inq_nature, i.inq_appraisal_staff, i.inq_appraisal_staff_dt, i.inq_support_staff, i.inq_support_staff_dt, i.inq_gis_staff, i.inq_gis_staff_dt, i.inq_field_check, i.inq_field_staff, i.inq_field_staff_dt, i.inq_field_check_completed_dt, i.inq_taxpayer_doc_requested, i.inq_taxpayer_doc_request_dt, i.inq_taxpayer_doc_expected_dt, i.inq_taxpayer_doc_received_dt, i.inq_taxpayer_doc_type, i.inq_value_agreement_amt, i.inq_value_agreement_mail_dt, i.inq_value_agreement_fax_dt, i.inq_value_agreement_received_dt, i.inq_by_type, i.inq_by_id, i.inq_by_id_type, i.inq_assigned_val, i.inq_assigned_reason_cd, i.inq_taxpayer_comments, i.inq_appraiser_comments, i.begin_land_hstd_val, i.begin_land_non_hstd_val, i.begin_imprv_hstd_val, i.begin_imprv_non_hstd_val, i.begin_ag_use_val, i.begin_ag_market, i.begin_timber_use, i.begin_timber_market, i.begin_market, i.begin_appraised_val, i.begin_ten_percent_cap, i.begin_assessed_val, i.begin_rendered_val, i.begin_exemptions, i.begin_entities, i.begin_recalc_dt, i.final_land_hstd_val, i.final_land_non_hstd_val, i.final_imprv_hstd_val, i.final_imprv_non_hstd_val, i.final_ag_use_val, i.final_ag_market, i.final_timber_use, i.final_timber_market, i.final_market, i.final_appraised_val, i.final_ten_percent_cap, i.final_assessed_val, i.final_rendered_val, i.final_exemptions, i.final_entities, i.final_recalc_dt, i.bGridComplete, i.closed_pacs_user_id, i.bGenerateCompGrid, i.status_date_changed, i.status_changed_user_id, i.associated_protest, i.appraiser_meeting_id, i.appraiser_meeting_appraiser_id, i.appraiser_meeting_date_time, i.appraiser_meeting_appraiser_comments, i.appraiser_meeting_taxpayer_comments, i.inq_operator_comments
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.prop_val_yr = i.prop_val_yr and
     d.case_id = i.case_id
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_case_id, @old_inq_create_dt, @old_inq_complete_dt, @old_inq_operator, @old_inq_type, @old_inq_status, @old_inq_nature, @old_inq_appraisal_staff, @old_inq_appraisal_staff_dt, @old_inq_support_staff, @old_inq_support_staff_dt, @old_inq_gis_staff, @old_inq_gis_staff_dt, @old_inq_field_check, @old_inq_field_staff, @old_inq_field_staff_dt, @old_inq_field_check_completed_dt, @old_inq_taxpayer_doc_requested, @old_inq_taxpayer_doc_request_dt, @old_inq_taxpayer_doc_expected_dt, @old_inq_taxpayer_doc_received_dt, @old_inq_taxpayer_doc_type, @old_inq_value_agreement_amt, @old_inq_value_agreement_mail_dt, @old_inq_value_agreement_fax_dt, @old_inq_value_agreement_received_dt, @old_inq_by_type, @old_inq_by_id, @old_inq_by_id_type, @old_inq_assigned_val, @old_inq_assigned_reason_cd, @old_inq_taxpayer_comments, @old_inq_appraiser_comments, @old_begin_land_hstd_val, @old_begin_land_non_hstd_val, @old_begin_imprv_hstd_val, @old_begin_imprv_non_hstd_val, @old_begin_ag_use_val, @old_begin_ag_market, @old_begin_timber_use, @old_begin_timber_market, @old_begin_market, @old_begin_appraised_val, @old_begin_ten_percent_cap, @old_begin_assessed_val, @old_begin_rendered_val, @old_begin_exemptions, @old_begin_entities, @old_begin_recalc_dt, @old_final_land_hstd_val, @old_final_land_non_hstd_val, @old_final_imprv_hstd_val, @old_final_imprv_non_hstd_val, @old_final_ag_use_val, @old_final_ag_market, @old_final_timber_use, @old_final_timber_market, @old_final_market, @old_final_appraised_val, @old_final_ten_percent_cap, @old_final_assessed_val, @old_final_rendered_val, @old_final_exemptions, @old_final_entities, @old_final_recalc_dt, @old_bGridComplete, @old_closed_pacs_user_id, @old_bGenerateCompGrid, @old_status_date_changed, @old_status_changed_user_id, @old_associated_protest, @old_appraiser_meeting_id, @old_appraiser_meeting_appraiser_id, @old_appraiser_meeting_date_time, @old_appraiser_meeting_appraiser_comments, @old_appraiser_meeting_taxpayer_comments, @old_inq_operator_comments, @new_prop_id, @new_prop_val_yr, @new_case_id, @new_inq_create_dt, @new_inq_complete_dt, @new_inq_operator, @new_inq_type, @new_inq_status, @new_inq_nature, @new_inq_appraisal_staff, @new_inq_appraisal_staff_dt, @new_inq_support_staff, @new_inq_support_staff_dt, @new_inq_gis_staff, @new_inq_gis_staff_dt, @new_inq_field_check, @new_inq_field_staff, @new_inq_field_staff_dt, @new_inq_field_check_completed_dt, @new_inq_taxpayer_doc_requested, @new_inq_taxpayer_doc_request_dt, @new_inq_taxpayer_doc_expected_dt, @new_inq_taxpayer_doc_received_dt, @new_inq_taxpayer_doc_type, @new_inq_value_agreement_amt, @new_inq_value_agreement_mail_dt, @new_inq_value_agreement_fax_dt, @new_inq_value_agreement_received_dt, @new_inq_by_type, @new_inq_by_id, @new_inq_by_id_type, @new_inq_assigned_val, @new_inq_assigned_reason_cd, @new_inq_taxpayer_comments, @new_inq_appraiser_comments, @new_begin_land_hstd_val, @new_begin_land_non_hstd_val, @new_begin_imprv_hstd_val, @new_begin_imprv_non_hstd_val, @new_begin_ag_use_val, @new_begin_ag_market, @new_begin_timber_use, @new_begin_timber_market, @new_begin_market, @new_begin_appraised_val, @new_begin_ten_percent_cap, @new_begin_assessed_val, @new_begin_rendered_val, @new_begin_exemptions, @new_begin_entities, @new_begin_recalc_dt, @new_final_land_hstd_val, @new_final_land_non_hstd_val, @new_final_imprv_hstd_val, @new_final_imprv_non_hstd_val, @new_final_ag_use_val, @new_final_ag_market, @new_final_timber_use, @new_final_timber_market, @new_final_market, @new_final_appraised_val, @new_final_ten_percent_cap, @new_final_assessed_val, @new_final_rendered_val, @new_final_exemptions, @new_final_entities, @new_final_recalc_dt, @new_bGridComplete, @new_closed_pacs_user_id, @new_bGenerateCompGrid, @new_status_date_changed, @new_status_changed_user_id, @new_associated_protest, @new_appraiser_meeting_id, @new_appraiser_meeting_appraiser_id, @new_appraiser_meeting_date_time, @new_appraiser_meeting_appraiser_comments, @new_appraiser_meeting_taxpayer_comments, @new_inq_operator_comments
 
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'case_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 612, convert(varchar(255), @old_case_id), convert(varchar(255), @new_case_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_create_dt <> @new_inq_create_dt
          or
          ( @old_inq_create_dt is null and @new_inq_create_dt is not null ) 
          or
          ( @old_inq_create_dt is not null and @new_inq_create_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_create_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2380, convert(varchar(255), @old_inq_create_dt), convert(varchar(255), @new_inq_create_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_complete_dt <> @new_inq_complete_dt
          or
          ( @old_inq_complete_dt is null and @new_inq_complete_dt is not null ) 
          or
          ( @old_inq_complete_dt is not null and @new_inq_complete_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_complete_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2379, convert(varchar(255), @old_inq_complete_dt), convert(varchar(255), @new_inq_complete_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_operator <> @new_inq_operator
          or
          ( @old_inq_operator is null and @new_inq_operator is not null ) 
          or
          ( @old_inq_operator is not null and @new_inq_operator is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_operator' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2389, convert(varchar(255), @old_inq_operator), convert(varchar(255), @new_inq_operator) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_type <> @new_inq_type
          or
          ( @old_inq_type is null and @new_inq_type is not null ) 
          or
          ( @old_inq_type is not null and @new_inq_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2404, convert(varchar(255), @old_inq_type), convert(varchar(255), @new_inq_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_status <> @new_inq_status
          or
          ( @old_inq_status is null and @new_inq_status is not null ) 
          or
          ( @old_inq_status is not null and @new_inq_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2395, convert(varchar(255), @old_inq_status), convert(varchar(255), @new_inq_status) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_nature <> @new_inq_nature
          or
          ( @old_inq_nature is null and @new_inq_nature is not null ) 
          or
          ( @old_inq_nature is not null and @new_inq_nature is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_nature' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2388, convert(varchar(255), @old_inq_nature), convert(varchar(255), @new_inq_nature) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_appraisal_staff <> @new_inq_appraisal_staff
          or
          ( @old_inq_appraisal_staff is null and @new_inq_appraisal_staff is not null ) 
          or
          ( @old_inq_appraisal_staff is not null and @new_inq_appraisal_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_appraisal_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2370, convert(varchar(255), @old_inq_appraisal_staff), convert(varchar(255), @new_inq_appraisal_staff) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_appraisal_staff_dt <> @new_inq_appraisal_staff_dt
          or
          ( @old_inq_appraisal_staff_dt is null and @new_inq_appraisal_staff_dt is not null ) 
          or
          ( @old_inq_appraisal_staff_dt is not null and @new_inq_appraisal_staff_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_appraisal_staff_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2371, convert(varchar(255), @old_inq_appraisal_staff_dt), convert(varchar(255), @new_inq_appraisal_staff_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_support_staff <> @new_inq_support_staff
          or
          ( @old_inq_support_staff is null and @new_inq_support_staff is not null ) 
          or
          ( @old_inq_support_staff is not null and @new_inq_support_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_support_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2396, convert(varchar(255), @old_inq_support_staff), convert(varchar(255), @new_inq_support_staff) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_support_staff_dt <> @new_inq_support_staff_dt
          or
          ( @old_inq_support_staff_dt is null and @new_inq_support_staff_dt is not null ) 
          or
          ( @old_inq_support_staff_dt is not null and @new_inq_support_staff_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_support_staff_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2397, convert(varchar(255), @old_inq_support_staff_dt), convert(varchar(255), @new_inq_support_staff_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_gis_staff <> @new_inq_gis_staff
          or
          ( @old_inq_gis_staff is null and @new_inq_gis_staff is not null ) 
          or
          ( @old_inq_gis_staff is not null and @new_inq_gis_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_gis_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2386, convert(varchar(255), @old_inq_gis_staff), convert(varchar(255), @new_inq_gis_staff) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_gis_staff_dt <> @new_inq_gis_staff_dt
          or
          ( @old_inq_gis_staff_dt is null and @new_inq_gis_staff_dt is not null ) 
          or
          ( @old_inq_gis_staff_dt is not null and @new_inq_gis_staff_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_gis_staff_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2387, convert(varchar(255), @old_inq_gis_staff_dt), convert(varchar(255), @new_inq_gis_staff_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_field_check <> @new_inq_field_check
          or
          ( @old_inq_field_check is null and @new_inq_field_check is not null ) 
          or
          ( @old_inq_field_check is not null and @new_inq_field_check is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_field_check' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2381, convert(varchar(255), @old_inq_field_check), convert(varchar(255), @new_inq_field_check) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_field_staff <> @new_inq_field_staff
          or
          ( @old_inq_field_staff is null and @new_inq_field_staff is not null ) 
          or
          ( @old_inq_field_staff is not null and @new_inq_field_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_field_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2383, convert(varchar(255), @old_inq_field_staff), convert(varchar(255), @new_inq_field_staff) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_field_staff_dt <> @new_inq_field_staff_dt
          or
          ( @old_inq_field_staff_dt is null and @new_inq_field_staff_dt is not null ) 
          or
          ( @old_inq_field_staff_dt is not null and @new_inq_field_staff_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_field_staff_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2384, convert(varchar(255), @old_inq_field_staff_dt), convert(varchar(255), @new_inq_field_staff_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_field_check_completed_dt <> @new_inq_field_check_completed_dt
          or
          ( @old_inq_field_check_completed_dt is null and @new_inq_field_check_completed_dt is not null ) 
          or
          ( @old_inq_field_check_completed_dt is not null and @new_inq_field_check_completed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_field_check_completed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2382, convert(varchar(255), @old_inq_field_check_completed_dt), convert(varchar(255), @new_inq_field_check_completed_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_taxpayer_doc_requested <> @new_inq_taxpayer_doc_requested
          or
          ( @old_inq_taxpayer_doc_requested is null and @new_inq_taxpayer_doc_requested is not null ) 
          or
          ( @old_inq_taxpayer_doc_requested is not null and @new_inq_taxpayer_doc_requested is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_taxpayer_doc_requested' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2402, convert(varchar(255), @old_inq_taxpayer_doc_requested), convert(varchar(255), @new_inq_taxpayer_doc_requested) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_taxpayer_doc_request_dt <> @new_inq_taxpayer_doc_request_dt
          or
          ( @old_inq_taxpayer_doc_request_dt is null and @new_inq_taxpayer_doc_request_dt is not null ) 
          or
          ( @old_inq_taxpayer_doc_request_dt is not null and @new_inq_taxpayer_doc_request_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_taxpayer_doc_request_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2401, convert(varchar(255), @old_inq_taxpayer_doc_request_dt), convert(varchar(255), @new_inq_taxpayer_doc_request_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_taxpayer_doc_expected_dt <> @new_inq_taxpayer_doc_expected_dt
          or
          ( @old_inq_taxpayer_doc_expected_dt is null and @new_inq_taxpayer_doc_expected_dt is not null ) 
          or
          ( @old_inq_taxpayer_doc_expected_dt is not null and @new_inq_taxpayer_doc_expected_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_taxpayer_doc_expected_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2399, convert(varchar(255), @old_inq_taxpayer_doc_expected_dt), convert(varchar(255), @new_inq_taxpayer_doc_expected_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_taxpayer_doc_received_dt <> @new_inq_taxpayer_doc_received_dt
          or
          ( @old_inq_taxpayer_doc_received_dt is null and @new_inq_taxpayer_doc_received_dt is not null ) 
          or
          ( @old_inq_taxpayer_doc_received_dt is not null and @new_inq_taxpayer_doc_received_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_taxpayer_doc_received_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2400, convert(varchar(255), @old_inq_taxpayer_doc_received_dt), convert(varchar(255), @new_inq_taxpayer_doc_received_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_taxpayer_doc_type <> @new_inq_taxpayer_doc_type
          or
          ( @old_inq_taxpayer_doc_type is null and @new_inq_taxpayer_doc_type is not null ) 
          or
          ( @old_inq_taxpayer_doc_type is not null and @new_inq_taxpayer_doc_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_taxpayer_doc_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2403, convert(varchar(255), @old_inq_taxpayer_doc_type), convert(varchar(255), @new_inq_taxpayer_doc_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_value_agreement_amt <> @new_inq_value_agreement_amt
          or
          ( @old_inq_value_agreement_amt is null and @new_inq_value_agreement_amt is not null ) 
          or
          ( @old_inq_value_agreement_amt is not null and @new_inq_value_agreement_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_value_agreement_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2405, convert(varchar(255), @old_inq_value_agreement_amt), convert(varchar(255), @new_inq_value_agreement_amt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_value_agreement_mail_dt <> @new_inq_value_agreement_mail_dt
          or
          ( @old_inq_value_agreement_mail_dt is null and @new_inq_value_agreement_mail_dt is not null ) 
          or
          ( @old_inq_value_agreement_mail_dt is not null and @new_inq_value_agreement_mail_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_value_agreement_mail_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2407, convert(varchar(255), @old_inq_value_agreement_mail_dt), convert(varchar(255), @new_inq_value_agreement_mail_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_value_agreement_fax_dt <> @new_inq_value_agreement_fax_dt
          or
          ( @old_inq_value_agreement_fax_dt is null and @new_inq_value_agreement_fax_dt is not null ) 
          or
          ( @old_inq_value_agreement_fax_dt is not null and @new_inq_value_agreement_fax_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_value_agreement_fax_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2406, convert(varchar(255), @old_inq_value_agreement_fax_dt), convert(varchar(255), @new_inq_value_agreement_fax_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_value_agreement_received_dt <> @new_inq_value_agreement_received_dt
          or
          ( @old_inq_value_agreement_received_dt is null and @new_inq_value_agreement_received_dt is not null ) 
          or
          ( @old_inq_value_agreement_received_dt is not null and @new_inq_value_agreement_received_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_value_agreement_received_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2408, convert(varchar(255), @old_inq_value_agreement_received_dt), convert(varchar(255), @new_inq_value_agreement_received_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_by_type <> @new_inq_by_type
          or
          ( @old_inq_by_type is null and @new_inq_by_type is not null ) 
          or
          ( @old_inq_by_type is not null and @new_inq_by_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_by_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2378, convert(varchar(255), @old_inq_by_type), convert(varchar(255), @new_inq_by_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_by_id <> @new_inq_by_id
          or
          ( @old_inq_by_id is null and @new_inq_by_id is not null ) 
          or
          ( @old_inq_by_id is not null and @new_inq_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2376, convert(varchar(255), @old_inq_by_id), convert(varchar(255), @new_inq_by_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_by_id_type <> @new_inq_by_id_type
          or
          ( @old_inq_by_id_type is null and @new_inq_by_id_type is not null ) 
          or
          ( @old_inq_by_id_type is not null and @new_inq_by_id_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_by_id_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2377, convert(varchar(255), @old_inq_by_id_type), convert(varchar(255), @new_inq_by_id_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_assigned_val <> @new_inq_assigned_val
          or
          ( @old_inq_assigned_val is null and @new_inq_assigned_val is not null ) 
          or
          ( @old_inq_assigned_val is not null and @new_inq_assigned_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_assigned_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2374, convert(varchar(255), @old_inq_assigned_val), convert(varchar(255), @new_inq_assigned_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_assigned_reason_cd <> @new_inq_assigned_reason_cd
          or
          ( @old_inq_assigned_reason_cd is null and @new_inq_assigned_reason_cd is not null ) 
          or
          ( @old_inq_assigned_reason_cd is not null and @new_inq_assigned_reason_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_assigned_reason_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2373, convert(varchar(255), @old_inq_assigned_reason_cd), convert(varchar(255), @new_inq_assigned_reason_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_taxpayer_comments <> @new_inq_taxpayer_comments
          or
          ( @old_inq_taxpayer_comments is null and @new_inq_taxpayer_comments is not null ) 
          or
          ( @old_inq_taxpayer_comments is not null and @new_inq_taxpayer_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_taxpayer_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2398, convert(varchar(255), @old_inq_taxpayer_comments), convert(varchar(255), @new_inq_taxpayer_comments) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_appraiser_comments <> @new_inq_appraiser_comments
          or
          ( @old_inq_appraiser_comments is null and @new_inq_appraiser_comments is not null ) 
          or
          ( @old_inq_appraiser_comments is not null and @new_inq_appraiser_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_appraiser_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2372, convert(varchar(255), @old_inq_appraiser_comments), convert(varchar(255), @new_inq_appraiser_comments) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_land_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 483, convert(varchar(255), @old_begin_land_hstd_val), convert(varchar(255), @new_begin_land_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_land_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 485, convert(varchar(255), @old_begin_land_non_hstd_val), convert(varchar(255), @new_begin_land_non_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_imprv_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 479, convert(varchar(255), @old_begin_imprv_hstd_val), convert(varchar(255), @new_begin_imprv_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_imprv_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 481, convert(varchar(255), @old_begin_imprv_non_hstd_val), convert(varchar(255), @new_begin_imprv_non_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_ag_use_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 467, convert(varchar(255), @old_begin_ag_use_val), convert(varchar(255), @new_begin_ag_use_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_ag_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 464, convert(varchar(255), @old_begin_ag_market), convert(varchar(255), @new_begin_ag_market) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_timber_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 494, convert(varchar(255), @old_begin_timber_use), convert(varchar(255), @new_begin_timber_use) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_timber_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 493, convert(varchar(255), @old_begin_timber_market), convert(varchar(255), @new_begin_timber_market) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 486, convert(varchar(255), @old_begin_market), convert(varchar(255), @new_begin_market) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_appraised_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 469, convert(varchar(255), @old_begin_appraised_val), convert(varchar(255), @new_begin_appraised_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_ten_percent_cap' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 490, convert(varchar(255), @old_begin_ten_percent_cap), convert(varchar(255), @new_begin_ten_percent_cap) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_assessed_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 471, convert(varchar(255), @old_begin_assessed_val), convert(varchar(255), @new_begin_assessed_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_rendered_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 489, convert(varchar(255), @old_begin_rendered_val), convert(varchar(255), @new_begin_rendered_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_exemptions' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 477, convert(varchar(255), @old_begin_exemptions), convert(varchar(255), @new_begin_exemptions) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_entities' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 476, convert(varchar(255), @old_begin_entities), convert(varchar(255), @new_begin_entities) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'begin_recalc_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 488, convert(varchar(255), @old_begin_recalc_dt), convert(varchar(255), @new_begin_recalc_dt) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_land_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1907, convert(varchar(255), @old_final_land_hstd_val), convert(varchar(255), @new_final_land_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_land_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1908, convert(varchar(255), @old_final_land_non_hstd_val), convert(varchar(255), @new_final_land_non_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_imprv_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1905, convert(varchar(255), @old_final_imprv_hstd_val), convert(varchar(255), @new_final_imprv_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_imprv_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1906, convert(varchar(255), @old_final_imprv_non_hstd_val), convert(varchar(255), @new_final_imprv_non_hstd_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_ag_use_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1900, convert(varchar(255), @old_final_ag_use_val), convert(varchar(255), @new_final_ag_use_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_ag_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1899, convert(varchar(255), @old_final_ag_market), convert(varchar(255), @new_final_ag_market) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_timber_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1914, convert(varchar(255), @old_final_timber_use), convert(varchar(255), @new_final_timber_use) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_timber_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1913, convert(varchar(255), @old_final_timber_market), convert(varchar(255), @new_final_timber_market) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1909, convert(varchar(255), @old_final_market), convert(varchar(255), @new_final_market) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_appraised_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1901, convert(varchar(255), @old_final_appraised_val), convert(varchar(255), @new_final_appraised_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_ten_percent_cap' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1912, convert(varchar(255), @old_final_ten_percent_cap), convert(varchar(255), @new_final_ten_percent_cap) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_assessed_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1902, convert(varchar(255), @old_final_assessed_val), convert(varchar(255), @new_final_assessed_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_rendered_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1911, convert(varchar(255), @old_final_rendered_val), convert(varchar(255), @new_final_rendered_val) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_exemptions' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1904, convert(varchar(255), @old_final_exemptions), convert(varchar(255), @new_final_exemptions) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_entities' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1903, convert(varchar(255), @old_final_entities), convert(varchar(255), @new_final_entities) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'final_recalc_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 1910, convert(varchar(255), @old_final_recalc_dt), convert(varchar(255), @new_final_recalc_dt) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'bGridComplete' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 497, convert(varchar(255), @old_bGridComplete), convert(varchar(255), @new_bGridComplete) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'closed_pacs_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 771, convert(varchar(255), @old_closed_pacs_user_id), convert(varchar(255), @new_closed_pacs_user_id) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'bGenerateCompGrid' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 496, convert(varchar(255), @old_bGenerateCompGrid), convert(varchar(255), @new_bGenerateCompGrid) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'status_date_changed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 4950, convert(varchar(255), @old_status_date_changed), convert(varchar(255), @new_status_date_changed) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'status_changed_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 4949, convert(varchar(255), @old_status_changed_user_id), convert(varchar(255), @new_status_changed_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_associated_protest <> @new_associated_protest
          or
          ( @old_associated_protest is null and @new_associated_protest is not null ) 
          or
          ( @old_associated_protest is not null and @new_associated_protest is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'associated_protest' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 346, convert(varchar(255), @old_associated_protest), convert(varchar(255), @new_associated_protest) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'appraiser_meeting_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 253, convert(varchar(255), @old_appraiser_meeting_id), convert(varchar(255), @new_appraiser_meeting_id) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'appraiser_meeting_appraiser_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 251, convert(varchar(255), @old_appraiser_meeting_appraiser_id), convert(varchar(255), @new_appraiser_meeting_appraiser_id) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'appraiser_meeting_date_time' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 252, convert(varchar(255), @old_appraiser_meeting_date_time), convert(varchar(255), @new_appraiser_meeting_date_time) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'appraiser_meeting_appraiser_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 250, convert(varchar(255), @old_appraiser_meeting_appraiser_comments), convert(varchar(255), @new_appraiser_meeting_appraiser_comments) )
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
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'appraiser_meeting_taxpayer_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 254, convert(varchar(255), @old_appraiser_meeting_taxpayer_comments), convert(varchar(255), @new_appraiser_meeting_taxpayer_comments) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     if (
          @old_inq_operator_comments <> @new_inq_operator_comments
          or
          ( @old_inq_operator_comments is null and @new_inq_operator_comments is not null ) 
          or
          ( @old_inq_operator_comments is not null and @new_inq_operator_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_inquiry' and
                    chg_log_columns = 'inq_operator_comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 9, 2390, convert(varchar(255), @old_inq_operator_comments), convert(varchar(255), @new_inq_operator_comments) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_case_id, @old_inq_create_dt, @old_inq_complete_dt, @old_inq_operator, @old_inq_type, @old_inq_status, @old_inq_nature, @old_inq_appraisal_staff, @old_inq_appraisal_staff_dt, @old_inq_support_staff, @old_inq_support_staff_dt, @old_inq_gis_staff, @old_inq_gis_staff_dt, @old_inq_field_check, @old_inq_field_staff, @old_inq_field_staff_dt, @old_inq_field_check_completed_dt, @old_inq_taxpayer_doc_requested, @old_inq_taxpayer_doc_request_dt, @old_inq_taxpayer_doc_expected_dt, @old_inq_taxpayer_doc_received_dt, @old_inq_taxpayer_doc_type, @old_inq_value_agreement_amt, @old_inq_value_agreement_mail_dt, @old_inq_value_agreement_fax_dt, @old_inq_value_agreement_received_dt, @old_inq_by_type, @old_inq_by_id, @old_inq_by_id_type, @old_inq_assigned_val, @old_inq_assigned_reason_cd, @old_inq_taxpayer_comments, @old_inq_appraiser_comments, @old_begin_land_hstd_val, @old_begin_land_non_hstd_val, @old_begin_imprv_hstd_val, @old_begin_imprv_non_hstd_val, @old_begin_ag_use_val, @old_begin_ag_market, @old_begin_timber_use, @old_begin_timber_market, @old_begin_market, @old_begin_appraised_val, @old_begin_ten_percent_cap, @old_begin_assessed_val, @old_begin_rendered_val, @old_begin_exemptions, @old_begin_entities, @old_begin_recalc_dt, @old_final_land_hstd_val, @old_final_land_non_hstd_val, @old_final_imprv_hstd_val, @old_final_imprv_non_hstd_val, @old_final_ag_use_val, @old_final_ag_market, @old_final_timber_use, @old_final_timber_market, @old_final_market, @old_final_appraised_val, @old_final_ten_percent_cap, @old_final_assessed_val, @old_final_rendered_val, @old_final_exemptions, @old_final_entities, @old_final_recalc_dt, @old_bGridComplete, @old_closed_pacs_user_id, @old_bGenerateCompGrid, @old_status_date_changed, @old_status_changed_user_id, @old_associated_protest, @old_appraiser_meeting_id, @old_appraiser_meeting_appraiser_id, @old_appraiser_meeting_date_time, @old_appraiser_meeting_appraiser_comments, @old_appraiser_meeting_taxpayer_comments, @old_inq_operator_comments, @new_prop_id, @new_prop_val_yr, @new_case_id, @new_inq_create_dt, @new_inq_complete_dt, @new_inq_operator, @new_inq_type, @new_inq_status, @new_inq_nature, @new_inq_appraisal_staff, @new_inq_appraisal_staff_dt, @new_inq_support_staff, @new_inq_support_staff_dt, @new_inq_gis_staff, @new_inq_gis_staff_dt, @new_inq_field_check, @new_inq_field_staff, @new_inq_field_staff_dt, @new_inq_field_check_completed_dt, @new_inq_taxpayer_doc_requested, @new_inq_taxpayer_doc_request_dt, @new_inq_taxpayer_doc_expected_dt, @new_inq_taxpayer_doc_received_dt, @new_inq_taxpayer_doc_type, @new_inq_value_agreement_amt, @new_inq_value_agreement_mail_dt, @new_inq_value_agreement_fax_dt, @new_inq_value_agreement_received_dt, @new_inq_by_type, @new_inq_by_id, @new_inq_by_id_type, @new_inq_assigned_val, @new_inq_assigned_reason_cd, @new_inq_taxpayer_comments, @new_inq_appraiser_comments, @new_begin_land_hstd_val, @new_begin_land_non_hstd_val, @new_begin_imprv_hstd_val, @new_begin_imprv_non_hstd_val, @new_begin_ag_use_val, @new_begin_ag_market, @new_begin_timber_use, @new_begin_timber_market, @new_begin_market, @new_begin_appraised_val, @new_begin_ten_percent_cap, @new_begin_assessed_val, @new_begin_rendered_val, @new_begin_exemptions, @new_begin_entities, @new_begin_recalc_dt, @new_final_land_hstd_val, @new_final_land_non_hstd_val, @new_final_imprv_hstd_val, @new_final_imprv_non_hstd_val, @new_final_ag_use_val, @new_final_ag_market, @new_final_timber_use, @new_final_timber_market, @new_final_market, @new_final_appraised_val, @new_final_ten_percent_cap, @new_final_assessed_val, @new_final_rendered_val, @new_final_exemptions, @new_final_entities, @new_final_recalc_dt, @new_bGridComplete, @new_closed_pacs_user_id, @new_bGenerateCompGrid, @new_status_date_changed, @new_status_changed_user_id, @new_associated_protest, @new_appraiser_meeting_id, @new_appraiser_meeting_appraiser_id, @new_appraiser_meeting_date_time, @new_appraiser_meeting_appraiser_comments, @new_appraiser_meeting_taxpayer_comments, @new_inq_operator_comments
end
 
close curRows
deallocate curRows

GO



create trigger tr__arb_inquiry_insert_ChangeLog
on _arb_inquiry
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
select @tvar_lFutureYear = future_yr
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
declare @inq_create_dt datetime
declare @inq_complete_dt datetime
declare @inq_operator int
declare @inq_type varchar(10)
declare @inq_status varchar(10)
declare @inq_nature varchar(10)
declare @inq_appraisal_staff int
declare @inq_appraisal_staff_dt datetime
declare @inq_support_staff int
declare @inq_support_staff_dt datetime
declare @inq_gis_staff int
declare @inq_gis_staff_dt datetime
declare @inq_field_check char(1)
declare @inq_field_staff int
declare @inq_field_staff_dt datetime
declare @inq_field_check_completed_dt datetime
declare @inq_taxpayer_doc_requested char(1)
declare @inq_taxpayer_doc_request_dt datetime
declare @inq_taxpayer_doc_expected_dt datetime
declare @inq_taxpayer_doc_received_dt datetime
declare @inq_taxpayer_doc_type varchar(10)
declare @inq_value_agreement_amt numeric(14,0)
declare @inq_value_agreement_mail_dt datetime
declare @inq_value_agreement_fax_dt datetime
declare @inq_value_agreement_received_dt datetime
declare @inq_by_type varchar(10)
declare @inq_by_id int
declare @inq_by_id_type int
declare @inq_assigned_val numeric(14,0)
declare @inq_assigned_reason_cd varchar(10)
declare @inq_taxpayer_comments varchar(1024)
declare @inq_appraiser_comments varchar(1024)
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
declare @associated_protest int
declare @appraiser_meeting_id int
declare @appraiser_meeting_appraiser_id int
declare @appraiser_meeting_date_time datetime
declare @appraiser_meeting_appraiser_comments varchar(1024)
declare @appraiser_meeting_taxpayer_comments varchar(1024)
declare @inq_operator_comments varchar(1024)
 
declare curRows cursor
for
     select prop_id, prop_val_yr, case_id, inq_create_dt, inq_complete_dt, inq_operator, inq_type, inq_status, inq_nature, inq_appraisal_staff, inq_appraisal_staff_dt, inq_support_staff, inq_support_staff_dt, inq_gis_staff, inq_gis_staff_dt, inq_field_check, inq_field_staff, inq_field_staff_dt, inq_field_check_completed_dt, inq_taxpayer_doc_requested, inq_taxpayer_doc_request_dt, inq_taxpayer_doc_expected_dt, inq_taxpayer_doc_received_dt, inq_taxpayer_doc_type, inq_value_agreement_amt, inq_value_agreement_mail_dt, inq_value_agreement_fax_dt, inq_value_agreement_received_dt, inq_by_type, inq_by_id, inq_by_id_type, inq_assigned_val, inq_assigned_reason_cd, inq_taxpayer_comments, inq_appraiser_comments, begin_land_hstd_val, begin_land_non_hstd_val, begin_imprv_hstd_val, begin_imprv_non_hstd_val, begin_ag_use_val, begin_ag_market, begin_timber_use, begin_timber_market, begin_market, begin_appraised_val, begin_ten_percent_cap, begin_assessed_val, begin_rendered_val, begin_exemptions, begin_entities, begin_recalc_dt, final_land_hstd_val, final_land_non_hstd_val, final_imprv_hstd_val, final_imprv_non_hstd_val, final_ag_use_val, final_ag_market, final_timber_use, final_timber_market, final_market, final_appraised_val, final_ten_percent_cap, final_assessed_val, final_rendered_val, final_exemptions, final_entities, final_recalc_dt, bGridComplete, closed_pacs_user_id, bGenerateCompGrid, status_date_changed, status_changed_user_id, associated_protest, appraiser_meeting_id, appraiser_meeting_appraiser_id, appraiser_meeting_date_time, appraiser_meeting_appraiser_comments, appraiser_meeting_taxpayer_comments, inq_operator_comments from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @inq_create_dt, @inq_complete_dt, @inq_operator, @inq_type, @inq_status, @inq_nature, @inq_appraisal_staff, @inq_appraisal_staff_dt, @inq_support_staff, @inq_support_staff_dt, @inq_gis_staff, @inq_gis_staff_dt, @inq_field_check, @inq_field_staff, @inq_field_staff_dt, @inq_field_check_completed_dt, @inq_taxpayer_doc_requested, @inq_taxpayer_doc_request_dt, @inq_taxpayer_doc_expected_dt, @inq_taxpayer_doc_received_dt, @inq_taxpayer_doc_type, @inq_value_agreement_amt, @inq_value_agreement_mail_dt, @inq_value_agreement_fax_dt, @inq_value_agreement_received_dt, @inq_by_type, @inq_by_id, @inq_by_id_type, @inq_assigned_val, @inq_assigned_reason_cd, @inq_taxpayer_comments, @inq_appraiser_comments, @begin_land_hstd_val, @begin_land_non_hstd_val, @begin_imprv_hstd_val, @begin_imprv_non_hstd_val, @begin_ag_use_val, @begin_ag_market, @begin_timber_use, @begin_timber_market, @begin_market, @begin_appraised_val, @begin_ten_percent_cap, @begin_assessed_val, @begin_rendered_val, @begin_exemptions, @begin_entities, @begin_recalc_dt, @final_land_hstd_val, @final_land_non_hstd_val, @final_imprv_hstd_val, @final_imprv_non_hstd_val, @final_ag_use_val, @final_ag_market, @final_timber_use, @final_timber_market, @final_market, @final_appraised_val, @final_ten_percent_cap, @final_assessed_val, @final_rendered_val, @final_exemptions, @final_entities, @final_recalc_dt, @bGridComplete, @closed_pacs_user_id, @bGenerateCompGrid, @status_date_changed, @status_changed_user_id, @associated_protest, @appraiser_meeting_id, @appraiser_meeting_appraiser_id, @appraiser_meeting_date_time, @appraiser_meeting_appraiser_comments, @appraiser_meeting_taxpayer_comments, @inq_operator_comments
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @case_id) + '-' + convert(varchar(4), @prop_val_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'case_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 612, null, convert(varchar(255), @case_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_create_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2380, null, convert(varchar(255), @inq_create_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_complete_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2379, null, convert(varchar(255), @inq_complete_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_operator' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2389, null, convert(varchar(255), @inq_operator), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2404, null, convert(varchar(255), @inq_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2395, null, convert(varchar(255), @inq_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_nature' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2388, null, convert(varchar(255), @inq_nature), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_appraisal_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2370, null, convert(varchar(255), @inq_appraisal_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_appraisal_staff_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2371, null, convert(varchar(255), @inq_appraisal_staff_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_support_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2396, null, convert(varchar(255), @inq_support_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_support_staff_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2397, null, convert(varchar(255), @inq_support_staff_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_gis_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2386, null, convert(varchar(255), @inq_gis_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_gis_staff_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2387, null, convert(varchar(255), @inq_gis_staff_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_field_check' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2381, null, convert(varchar(255), @inq_field_check), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_field_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2383, null, convert(varchar(255), @inq_field_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_field_staff_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2384, null, convert(varchar(255), @inq_field_staff_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_field_check_completed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2382, null, convert(varchar(255), @inq_field_check_completed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_taxpayer_doc_requested' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2402, null, convert(varchar(255), @inq_taxpayer_doc_requested), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_taxpayer_doc_request_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2401, null, convert(varchar(255), @inq_taxpayer_doc_request_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_taxpayer_doc_expected_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2399, null, convert(varchar(255), @inq_taxpayer_doc_expected_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_taxpayer_doc_received_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2400, null, convert(varchar(255), @inq_taxpayer_doc_received_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_taxpayer_doc_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2403, null, convert(varchar(255), @inq_taxpayer_doc_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_value_agreement_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2405, null, convert(varchar(255), @inq_value_agreement_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_value_agreement_mail_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2407, null, convert(varchar(255), @inq_value_agreement_mail_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_value_agreement_fax_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2406, null, convert(varchar(255), @inq_value_agreement_fax_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_value_agreement_received_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2408, null, convert(varchar(255), @inq_value_agreement_received_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_by_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2378, null, convert(varchar(255), @inq_by_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2376, null, convert(varchar(255), @inq_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_by_id_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2377, null, convert(varchar(255), @inq_by_id_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_assigned_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2374, null, convert(varchar(255), @inq_assigned_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_assigned_reason_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2373, null, convert(varchar(255), @inq_assigned_reason_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_taxpayer_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2398, null, convert(varchar(255), @inq_taxpayer_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_appraiser_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2372, null, convert(varchar(255), @inq_appraiser_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_land_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 483, null, convert(varchar(255), @begin_land_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_land_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 485, null, convert(varchar(255), @begin_land_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_imprv_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 479, null, convert(varchar(255), @begin_imprv_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_imprv_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 481, null, convert(varchar(255), @begin_imprv_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_ag_use_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 467, null, convert(varchar(255), @begin_ag_use_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_ag_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 464, null, convert(varchar(255), @begin_ag_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_timber_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 494, null, convert(varchar(255), @begin_timber_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_timber_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 493, null, convert(varchar(255), @begin_timber_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 486, null, convert(varchar(255), @begin_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_appraised_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 469, null, convert(varchar(255), @begin_appraised_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_ten_percent_cap' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 490, null, convert(varchar(255), @begin_ten_percent_cap), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_assessed_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 471, null, convert(varchar(255), @begin_assessed_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_rendered_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 489, null, convert(varchar(255), @begin_rendered_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_exemptions' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 477, null, convert(varchar(255), @begin_exemptions), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_entities' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 476, null, convert(varchar(255), @begin_entities), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'begin_recalc_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 488, null, convert(varchar(255), @begin_recalc_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_land_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1907, null, convert(varchar(255), @final_land_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_land_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1908, null, convert(varchar(255), @final_land_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_imprv_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1905, null, convert(varchar(255), @final_imprv_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_imprv_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1906, null, convert(varchar(255), @final_imprv_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_ag_use_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1900, null, convert(varchar(255), @final_ag_use_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_ag_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1899, null, convert(varchar(255), @final_ag_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_timber_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1914, null, convert(varchar(255), @final_timber_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_timber_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1913, null, convert(varchar(255), @final_timber_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1909, null, convert(varchar(255), @final_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_appraised_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1901, null, convert(varchar(255), @final_appraised_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_ten_percent_cap' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1912, null, convert(varchar(255), @final_ten_percent_cap), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_assessed_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1902, null, convert(varchar(255), @final_assessed_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_rendered_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1911, null, convert(varchar(255), @final_rendered_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_exemptions' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1904, null, convert(varchar(255), @final_exemptions), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_entities' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1903, null, convert(varchar(255), @final_entities), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'final_recalc_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 1910, null, convert(varchar(255), @final_recalc_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'bGridComplete' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 497, null, convert(varchar(255), @bGridComplete), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'closed_pacs_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 771, null, convert(varchar(255), @closed_pacs_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'bGenerateCompGrid' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 496, null, convert(varchar(255), @bGenerateCompGrid), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'status_date_changed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 4950, null, convert(varchar(255), @status_date_changed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'status_changed_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 4949, null, convert(varchar(255), @status_changed_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'associated_protest' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 346, null, convert(varchar(255), @associated_protest), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'appraiser_meeting_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 253, null, convert(varchar(255), @appraiser_meeting_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'appraiser_meeting_appraiser_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 251, null, convert(varchar(255), @appraiser_meeting_appraiser_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'appraiser_meeting_date_time' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 252, null, convert(varchar(255), @appraiser_meeting_date_time), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'appraiser_meeting_appraiser_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 250, null, convert(varchar(255), @appraiser_meeting_appraiser_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'appraiser_meeting_taxpayer_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 254, null, convert(varchar(255), @appraiser_meeting_taxpayer_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_inquiry' and
               chg_log_columns = 'inq_operator_comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 9, 2390, null, convert(varchar(255), @inq_operator_comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     end
 
     fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @inq_create_dt, @inq_complete_dt, @inq_operator, @inq_type, @inq_status, @inq_nature, @inq_appraisal_staff, @inq_appraisal_staff_dt, @inq_support_staff, @inq_support_staff_dt, @inq_gis_staff, @inq_gis_staff_dt, @inq_field_check, @inq_field_staff, @inq_field_staff_dt, @inq_field_check_completed_dt, @inq_taxpayer_doc_requested, @inq_taxpayer_doc_request_dt, @inq_taxpayer_doc_expected_dt, @inq_taxpayer_doc_received_dt, @inq_taxpayer_doc_type, @inq_value_agreement_amt, @inq_value_agreement_mail_dt, @inq_value_agreement_fax_dt, @inq_value_agreement_received_dt, @inq_by_type, @inq_by_id, @inq_by_id_type, @inq_assigned_val, @inq_assigned_reason_cd, @inq_taxpayer_comments, @inq_appraiser_comments, @begin_land_hstd_val, @begin_land_non_hstd_val, @begin_imprv_hstd_val, @begin_imprv_non_hstd_val, @begin_ag_use_val, @begin_ag_market, @begin_timber_use, @begin_timber_market, @begin_market, @begin_appraised_val, @begin_ten_percent_cap, @begin_assessed_val, @begin_rendered_val, @begin_exemptions, @begin_entities, @begin_recalc_dt, @final_land_hstd_val, @final_land_non_hstd_val, @final_imprv_hstd_val, @final_imprv_non_hstd_val, @final_ag_use_val, @final_ag_market, @final_timber_use, @final_timber_market, @final_market, @final_appraised_val, @final_ten_percent_cap, @final_assessed_val, @final_rendered_val, @final_exemptions, @final_entities, @final_recalc_dt, @bGridComplete, @closed_pacs_user_id, @bGenerateCompGrid, @status_date_changed, @status_changed_user_id, @associated_protest, @appraiser_meeting_id, @appraiser_meeting_appraiser_id, @appraiser_meeting_date_time, @appraiser_meeting_appraiser_comments, @appraiser_meeting_taxpayer_comments, @inq_operator_comments
end
 
close curRows
deallocate curRows

GO



create trigger tr__arb_inquiry_delete_ChangeLog
on _arb_inquiry
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
          chg_log_tables = '_arb_inquiry' and
          chg_log_audit = 1
)
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
select @tvar_lFutureYear = future_yr
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
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 9, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
 
     fetch next from curRows into @prop_id, @prop_val_yr, @case_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final AG HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'final_ag_hs_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final timer HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'final_timber_hs_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Inquiry Recheck Date, for use with Monitors', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'inq_recheck_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin appraised Non-Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'begin_appraised_NonClassified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final AG HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'final_ag_hs_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final appraised Non-Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'final_appraised_NonClassified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin timer HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'begin_timber_hs_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin timer HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'begin_timber_hs_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin appraised Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'begin_appraised_Classified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final timer HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'final_timber_hs_mkt_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin AG HS use value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'begin_ag_hs_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'final appraised Classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'final_appraised_Classified';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'begin AG HS market value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry', @level2type = N'COLUMN', @level2name = N'begin_ag_hs_mkt_val';


GO

