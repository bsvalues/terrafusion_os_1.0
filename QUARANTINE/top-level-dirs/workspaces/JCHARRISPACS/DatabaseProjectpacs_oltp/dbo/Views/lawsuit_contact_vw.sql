

create view lawsuit_contact_vw

as

	select
		lc.lawsuit_id,
		lc.contact_id,
		lc.contact_type_cd,
		a.acct_id
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then a.file_as_name
			else lc.contact_name
		end as contact_name
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then a.email_addr
			else lc.contact_email
		end as email
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then addr.addr_line1
			else lc.contact_addr1
		end as addr1
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then addr.addr_line2
			else lc.contact_addr2
		end as addr2
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then addr.addr_city
			else lc.contact_city
		end as city
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then addr.addr_state
			else lc.contact_state
		end as state
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then addr.addr_zip
			else lc.contact_zip
		end as zip
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then a.web_addr
			else lc.contact_url
		end as url
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then p_business.phone_num
			else lc.contact_phone_business
		end as phone_business
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then p_home.phone_num
			else lc.contact_phone_home
		end as phone_home
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then p_cell.phone_num
			else lc.contact_phone_cell
		end as phone_cell
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then p_pager.phone_num
			else lc.contact_phone_pager
		end as phone_pager
		,
		case
			when a.acct_id is not null AND a.acct_id <> 0
			then p_fax.phone_num
			else lc.contact_phone_fax
		end as phone_fax
		,
		lc.contact_phone_other as phone_other,
		lct.contact_desc
	from lawsuit_contact as lc
		with (nolock)
	inner join lawsuit_contact_type as lct
		with (nolock)
		on lc.contact_type_cd = lct.contact_cd
	left outer join account as a 
		with (nolock)
		on lc.acct_id = a.acct_id
	left outer join address as addr 
		with (nolock)
		on lc.acct_id = addr.acct_id and
		addr.primary_addr = 'Y'
	left outer join phone as p_business
		with (nolock)
		on lc.acct_id = p_business.acct_id and
		p_business.phone_type_cd = 'B'
	left outer join phone as p_home 
		with (nolock)
		on lc.acct_id = p_home.acct_id and
		p_home.phone_type_cd = 'H'
	left outer join phone as p_cell
		with (nolock)
		on lc.acct_id = p_cell.acct_id and
		p_cell.phone_type_cd = 'C'
	left outer join phone as p_pager
		with (nolock)
		on lc.acct_id = p_pager.acct_id and
		p_pager.phone_type_cd = 'P'
	left outer join phone as p_fax
		with (nolock)
		on lc.acct_id = p_fax.acct_id and
		p_fax.phone_type_cd = 'F'

GO

