
create procedure ChangeLogSelectProperty
	@lPropertyID int,
	@lYearExclude int = null
as

	select distinct
		cl.lChangeID,
		cl.dtChange,
		pacs_user.pacs_user_name,
		cl.szMachineName,
		cl.szChangeType,
		change_log_propid_vw.prop_id,
		change_log_propvalyr_vw.prop_val_yr,
		change_log_supnum_vw.sup_num,
		cl.szRefID,
		chg_log_columns.chg_log_description,
		cl.szOldValue,
		cl.szNewValue
		
	from change_log_propid_vw with(nolock)
	left outer join change_log_propvalyr_vw with(nolock) on
		change_log_propvalyr_vw.lChangeID = change_log_propid_vw.lChangeID
	left outer join change_log_supnum_vw with(nolock) on
		change_log_supnum_vw.lChangeID = change_log_propid_vw.lChangeID
	join change_log as cl with(nolock) on
		cl.lChangeID = change_log_propid_vw.lChangeID

	left outer join pacs_user with(nolock) on
		pacs_user.pacs_user_id = cl.lPacsUserID

	join pacs_tables with(nolock) on
		cl.iTableID = pacs_tables.iTableID
	join pacs_columns with(nolock) on
		cl.iColumnID = pacs_columns.iColumnID
	left outer join chg_log_columns with(nolock) on
		pacs_tables.szTableName = chg_log_columns.chg_log_tables and
		pacs_columns.szColumnName = chg_log_columns.chg_log_columns
		
	where
		change_log_propid_vw.prop_id = @lPropertyID and
		(@lYearExclude is null or change_log_propvalyr_vw.prop_val_yr is null or change_log_propvalyr_vw.prop_val_yr != @lYearExclude)

	order by cl.dtChange desc

GO

