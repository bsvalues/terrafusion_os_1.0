




create view dbo.mh_balance_vw
as
select
	b.prop_id,
	b.sup_tax_yr as tax_yr,
	b.entity_id,
	left(isnull(i.mbl_hm_hud_num, ''), 10) as mbl_hm_hud_num,
	left(isnull(i.mbl_hm_sn, ''), 26) as mbl_hm_sn,
	left(isnull(i.mbl_hm_model, ''), 20) as mbl_hm_model,
	cast
	(
		sum
		(
			(b.bill_adj_m_n_o + b.bill_adj_i_n_s)
		-	(
				(b.bill_m_n_o_pd + b.bill_i_n_s_pd + b.discount_mno_pd + b.discount_ins_pd + b.underage_mno_pd + b.underage_ins_pd)
			-	(b.refund_m_n_o_pd + b.refund_i_n_s_pd + b.refund_disc_mno_pd + b.refund_disc_ins_pd)
			)
		) as numeric(8,2)
	) as tax_amount,
	p.col_owner_id as owner_id,
	acct_owner.file_as_name as owner_name,
	e.entity_cd,
	e.taxing_unit_num,
	acct_entity.file_as_name as entity_name
from
	dbo.property as p with (nolock)
inner join
	dbo.account as acct_owner with (nolock)
on
	acct_owner.acct_id = p.col_owner_id
inner join
	dbo.bill as b with (nolock)
on
	b.prop_id = p.prop_id
and	b.coll_status_cd <> 'RS'
and	isnull(b.active_bill, 'T') = 'T'
inner join
	dbo.entity as e with (nolock)
on
	e.entity_id = b.entity_id
inner join
	dbo.account as acct_entity with (nolock)
on
	acct_entity.acct_id = e.entity_id
inner join
	dbo.prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = p.prop_id
inner join
	dbo.property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_val_yr in
(
	select
		max(owner_tax_yr)
	from
		dbo.prop_supp_assoc as psa1 with (nolock)
	where
		psa1.prop_id = pv.prop_id
)
inner join
	dbo.imprv as i with (nolock)
on
	i.prop_id = pv.prop_id
and	i.prop_val_yr = pv.prop_val_yr
and	i.sup_num = pv.sup_num
and	i.sale_id = 0
and
(
	len(isnull(i.mbl_hm_sn, '')) > 0
or	len(isnull(i.mbl_hm_hud_num, '')) > 0
)
and	i.imprv_id in
(
	select
		max(imprv_id)
	from
		dbo.imprv as i2 with (nolock)
	inner join
		dbo.imprv_type as it with (nolock)
	on
		it.imprv_type_cd = i2.imprv_type_cd
	and	isnull(it.mobile_home, 'Y') = 'Y'
	where
		i2.prop_id = pv.prop_id
	and	i2.prop_val_yr = pv.prop_val_yr
	and	i2.sup_num = pv.sup_num
	and	i2.sale_id = 0
	and
	(
		len(isnull(i2.mbl_hm_sn, '')) > 0
	or	len(isnull(i2.mbl_hm_hud_num, '')) > 0
	)
)
group by
	b.prop_id,
	b.sup_tax_yr,
	b.entity_id,
	left(isnull(i.mbl_hm_hud_num, ''), 10),
	left(isnull(i.mbl_hm_sn, ''), 26),
	left(isnull(i.mbl_hm_model, ''), 20),
	p.col_owner_id,
	acct_owner.file_as_name,
	e.entity_cd,
	e.taxing_unit_num,
	acct_entity.file_as_name

GO

