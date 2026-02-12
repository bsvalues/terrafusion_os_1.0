

CREATE VIEW dbo.arb_protest_sign_in_list_vw
AS
SELECT DISTINCT 
                      ao.file_as_name AS owner_name, ISNULL(aa.file_as_name, '') AS agent_name, dbo._arb_protest.prot_type, dbo._arb_protest.prop_id, 
                      dbo.property_val.legal_desc, dbo._arb_protest.prop_val_yr, dbo._arb_protest.case_id, dbo._arb_protest_hearing_docket.docket_start_date_time, 
		  DATEPART(yyyy, dbo._arb_protest_hearing_docket.docket_start_date_time) as docket_start_year,
		  DATEPART(m, dbo._arb_protest_hearing_docket.docket_start_date_time) as docket_start_month,
		  DATEPART(d, dbo._arb_protest_hearing_docket.docket_start_date_time) as docket_start_day,
		  DATEPART(hh, dbo._arb_protest_hearing_docket.docket_start_date_time) as docket_start_hour, 
		  DATEPART(mi, dbo._arb_protest_hearing_docket.docket_start_date_time) as docket_start_minute, 
                      dbo._arb_protest.prot_assigned_panel, dbo._arb_protest_hearing.szHearingType AS agent_docket_indicator, dbo._arb_protest.prot_complete_dt, 
                      dbo._arb_protest.docket_id, property_val.last_appraiser_id, _arb_protest.appraiser_meeting_appraiser_id,
		      dbo.property_val.property_use_cd as property_use_cd		
FROM         dbo._arb_protest_hearing INNER JOIN
                      dbo._arb_protest_hearing_docket ON dbo._arb_protest_hearing.lHearingID = dbo._arb_protest_hearing_docket.lHearingID RIGHT OUTER JOIN
                      dbo._arb_protest INNER JOIN
                      dbo.prop_supp_assoc ON dbo._arb_protest.prop_id = dbo.prop_supp_assoc.prop_id AND 
                      dbo._arb_protest.prop_val_yr = dbo.prop_supp_assoc.owner_tax_yr INNER JOIN
                      dbo.owner ON dbo._arb_protest.prop_id = dbo.owner.prop_id AND dbo.owner.owner_tax_yr = dbo.prop_supp_assoc.owner_tax_yr AND 
                      dbo.owner.sup_num = dbo.prop_supp_assoc.sup_num INNER JOIN
                      dbo.account ao ON dbo.owner.owner_id = ao.acct_id INNER JOIN
                      dbo.property ON dbo._arb_protest.prop_id = dbo.property.prop_id INNER JOIN
                      dbo.property_val ON dbo.owner.prop_id = dbo.property_val.prop_id AND dbo.owner.owner_tax_yr = dbo.property_val.prop_val_yr AND 
                      dbo.owner.sup_num = dbo.property_val.sup_num ON dbo._arb_protest_hearing_docket.docket_id = dbo._arb_protest.docket_id LEFT OUTER JOIN
                      dbo.agent_assoc ON dbo.prop_supp_assoc.owner_tax_yr = dbo.agent_assoc.owner_tax_yr AND 
                      dbo._arb_protest.prop_id = dbo.agent_assoc.prop_id AND dbo.owner.owner_id = dbo.agent_assoc.owner_id AND ISNULL(dbo.agent_assoc.exp_dt, 
                      GETDATE() + 1) > GETDATE() LEFT OUTER JOIN
                      dbo.account aa ON dbo.agent_assoc.agent_id = aa.acct_id
WHERE     (dbo._arb_protest.docket_id > 0)

GO

