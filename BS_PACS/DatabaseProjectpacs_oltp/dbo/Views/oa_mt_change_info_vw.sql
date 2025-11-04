
create view oa_mt_change_info_vw
as
select
	[record_type],
	[prop_id],
	[prop_val_yr],
	[current_account_id],
	[current_percentage],
	[current_name],
	[current_addr1],
	[current_addr2],
	[current_addr3],
	[current_city],
	[current_state],
	[current_zip],
	[current_deliverable_flag],
	[current_country],
	[current_confidential_flag],
	[prop_type_desc],
	[geo_id],
	[legal_description],
	[legal_acreage],
	[abs_subdv_cd],
	[block],
	[tract_or_lot],
	[entities],
	[change_reason],
	[ownership_chg_dt],
	[address_chg_dt],
	[deed_book_id],
	[deed_book_page],
	[deed_type],
	[deed_num],
	[deed_dt],
	[deed_recorded_dt],
	[dba_name],
	cast(convert(varchar(10), chg_dt, 101) as datetime) as chg_dt,
	[ref_id1],
	[ref_id2],
	[zip_cass],
	[zip_route],
	[addr_supp_flag],
	[dataset_id]
	from oa_mt_change_info

GO

