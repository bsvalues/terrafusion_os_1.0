

CREATE VIEW ptd_sale_submission_export_grantor_grantee_vw

AS

SELECT DISTINCT coo.chg_of_owner_id, coopa.prop_id,
	case when sa.chg_of_owner_id is null then coo.grantor_cv else seller_account.file_as_name end as grantor_file_as_name,
	case 	when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then seller_address.addr_line3
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then seller_address.addr_line2
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then seller_address.addr_line1
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) = 0 then seller_address.addr_line2
		else seller_address.addr_line1 end as grantor_addr_line1,
	case 	when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then seller_address.addr_line3
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then seller_address.addr_line3
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) = 0 then null
		else seller_address.addr_line2 end as grantor_addr_line2,
	case 	when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(seller_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(seller_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(seller_address.addr_line3, '')))) = 0 then null
		else seller_address.addr_line3 end as grantor_addr_line3,
	seller_address.addr_city as grantor_addr_city,
	seller_address.addr_state as grantor_addr_state,
	seller_address.addr_zip as grantor_addr_zip,
	seller_address.country_cd as grantor_country_cd,
	case when fbv.chg_of_owner_id is null then coo.grantee_cv else buyer_account.file_as_name end as grantee_file_as_name,
	case 	when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then buyer_address.addr_line3
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then buyer_address.addr_line2
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then buyer_address.addr_line1
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) = 0 then buyer_address.addr_line2
		else buyer_address.addr_line1 end as grantee_addr_line1,
	case 	when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then buyer_address.addr_line3
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then buyer_address.addr_line3
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) = 0 then null
		else buyer_address.addr_line2 end as grantee_addr_line2,
	case 	when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) > 0 then null
		when len(ltrim(rtrim(isnull(buyer_address.addr_line1, '')))) = 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line2, '')))) > 0 and len(ltrim(rtrim(isnull(buyer_address.addr_line3, '')))) = 0 then null
		else buyer_address.addr_line3 end as grantee_addr_line3,
	buyer_address.addr_city as grantee_addr_city,
	buyer_address.addr_state as grantee_addr_state,
	buyer_address.addr_zip as grantee_addr_zip,
	buyer_address.country_cd as grantee_country_cd

from dbo.chg_of_owner_prop_assoc as coopa with(nolock)
join dbo.chg_of_owner as coo with(nolock) on
	coo.chg_of_owner_id = coopa.chg_of_owner_id
join dbo.chg_of_owner_first_buyer_vw as fbv with(nolock) on
	fbv.chg_of_owner_id = coopa.chg_of_owner_id
join dbo.seller_assoc as sa with(nolock) on
	sa.chg_of_owner_id = coopa.chg_of_owner_id and
	sa.prop_id = coopa.prop_id
join dbo.account as seller_account with(nolock) on
	seller_account.acct_id = sa.seller_id
join dbo.account as buyer_account with(nolock) on
	buyer_account.acct_id = fbv.buyer_id
left outer join dbo.address as seller_address with(nolock) on
	seller_address.acct_id = sa.seller_id and
	seller_address.primary_addr = 'Y'
left outer join dbo.address as buyer_address with(nolock) on
	buyer_address.acct_id = fbv.buyer_id and
	buyer_address.primary_addr = 'Y'

GO

