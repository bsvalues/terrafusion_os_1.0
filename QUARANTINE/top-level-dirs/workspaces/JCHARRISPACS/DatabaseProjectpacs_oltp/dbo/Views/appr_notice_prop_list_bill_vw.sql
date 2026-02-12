

CREATE VIEW dbo.appr_notice_prop_list_bill_vw AS

	SELECT	dbo.appr_notice_prop_list_bill.notice_yr,
		dbo.appr_notice_prop_list_bill.notice_num,
		dbo.appr_notice_prop_list_bill.prop_id,
		dbo.prop_supp_assoc.sup_num,
		dbo.appr_notice_prop_list_bill.sup_yr,
		dbo.appr_notice_prop_list_bill.owner_id,
		dbo.appr_notice_prop_list_bill.entity_id,
		dbo.entity.entity_type_cd,
		dbo.account.file_as_name AS entity_name,
		dbo.appr_notice_prop_list_bill.bill_m_n_o,
		dbo.appr_notice_prop_list_bill.bill_i_n_s,
		dbo.appr_notice_prop_list_bill.assessed_val,
		dbo.appr_notice_prop_list_bill.taxable_val,
		dbo.appr_notice_prop_list_bill.tax_rate,
		dbo.appr_notice_prop_list_bill.prev_taxable_val,
		dbo.appr_notice_prop_list_bill.freeze_yr,
		IsNull(dbo.appr_notice_prop_list_bill.freeze_ceiling, 0.0) AS freeze_ceiling,
		dbo.appr_notice_prop_list_bill.use_freeze
	FROM	dbo.appr_notice_prop_list_bill
		INNER JOIN dbo.entity ON
			dbo.appr_notice_prop_list_bill.entity_id = dbo.entity.entity_id
		INNER JOIN dbo.account ON
			dbo.entity.entity_id = dbo.account.acct_id
		INNER JOIN dbo.prop_supp_assoc ON
			dbo.appr_notice_prop_list_bill.prop_id = dbo.prop_supp_assoc.prop_id AND
			dbo.appr_notice_prop_list_bill.sup_yr = dbo.prop_supp_assoc.owner_tax_yr

GO

