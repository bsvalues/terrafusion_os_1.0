

CREATE procedure CreatePropertyAuditTrail

@input_prop_id	int,
@input_user_id	int

as

delete from property_audit_trail where prop_id = @input_prop_id and pacs_user_id = @input_user_id

--Creation Transactions
--  Currently, there is a bug that manually created bills are being grouped in this select, but 
--  the initial_amount_due will be 0.00 on those once the Manually Create Bill process is fixed
insert into property_audit_trail 
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id ,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason,
	batch_id
)
select 
	@input_user_id,
	@input_prop_id,
	ct.create_date,
	ct.transaction_type,
	tt.transaction_desc,
	0,
	0,
	sum(ct.base_amount),
	sum(ct.base_amount),
	b.year,
	b.bill_type,
	'',
	ct.batch_id
from bill as b with (nolock)
join coll_transaction as ct with (nolock) on
		ct.trans_group_id = b.bill_id
join transaction_type as tt with (nolock) on 
		tt.transaction_type = ct.transaction_type
	and tt.core_transaction_type = 1
where	b.prop_id = @input_prop_id
	and b.is_active = 1
group by 
	b.year, ct.transaction_type, tt.transaction_desc, b.bill_type, ct.create_date, ct.batch_id
	
	--Fee Create Transactions
insert into property_audit_trail 
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id ,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason,
	batch_id
)
select 
	@input_user_id,
	@input_prop_id,
	ct.create_date,
	ct.transaction_type,
	tt.transaction_desc,
	0,
	0,
	sum(ct.base_amount),
	sum(ct.base_amount),
	f.year,
	f.fee_type_cd,
	'',ct.batch_id
from fee as f with (nolock)
join fee_property_vw fpa with (nolock)
on f.fee_id=fpa.fee_id
join coll_transaction as ct with (nolock) on
		ct.trans_group_id = f.fee_id
join transaction_type as tt with (nolock) on 
		tt.transaction_type = ct.transaction_type
	and tt.core_transaction_type = 1
where	fpa.prop_id = @input_prop_id
	and f.is_active = 1
group by 
	f.year, ct.transaction_type, tt.transaction_desc, f.fee_type_cd, ct.create_date, ct.batch_id


-- Bill Adjustment Transactions
insert into property_audit_trail
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id ,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason,
	batch_id
)
select 
	@input_user_id,
	@input_prop_id,
	isnull(ct.create_date, ba.adjustment_date) create_date,
	case 
		when ct.transaction_type is not null then ct.transaction_type
		when lb.bill_id is not null then 'ADJLB'
		when ab.bill_id is not null then 'ADJAB'
		else ''
	end,	
	case when ct.transaction_type is not null then
		tt.transaction_desc 
			+ case 
					when lb.bill_id is not null then ' ' + lb.levy_cd
					when ab.bill_id is not null then ' ' + saa.assessment_cd
					else ''
			  end
	else case when isnull(bct.modify_wizard, 0) = 1 then 'Modify Wizard - ' else '' end 
			+ bill_calc_type_desc
			+ case 
					when lb.bill_id is not null then ' ' + lb.levy_cd
					when ab.bill_id is not null then ' ' + saa.assessment_cd
					else ''
			  end
	end,
	isnull(ct.pacs_user_id, ba.pacs_user_id),
	ba.bill_adj_id,
	isnull(ct.base_amount, isNull(ba.base_tax, 0) - isNull(ba.previous_base_tax, 0)) base_amount,
	isnull(ct.base_amount, isNull(ba.base_tax, 0) - isNull(ba.previous_base_tax, 0)) base_amount,
	b.year,
	b.bill_type,
	left(ba.modify_reason, 50),
	isnull(ct.batch_id, ba.batch_id)
	
from bill b with(nolock)

join bill_adjustment ba with(nolock)
on b.bill_id = ba.bill_id

left join bill_calc_type bct with(nolock)
on ba.bill_calc_type_cd = bct.bill_calc_type_cd

left join coll_transaction ct with(nolock)
on b.bill_id = ct.trans_group_id 
and ba.transaction_id = ct.transaction_id

left join transaction_type tt with(nolock)
on tt.transaction_type = ct.transaction_type

left join assessment_bill ab with(nolock)
on b.bill_id = ab.bill_id

left join special_assessment_agency saa with(nolock)
on ab.agency_id = saa.agency_id

left join levy_bill lb with(nolock)
on b.bill_id = lb.bill_id

left join tax_district td with(nolock)
on lb.tax_district_id = td.tax_district_id

where	b.prop_id = @input_prop_id
and	b.is_active = 1


-- Fee Adjustment Transactions
insert into property_audit_trail
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id ,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason,
	batch_id
)
select 
	@input_user_id,
	@input_prop_id,
	isnull(ct.create_date, fa.adjustment_date) create_date,
	isnull(ct.transaction_type, 'ADJF') transaction_type, 
	case when ct.transaction_type is not null then
		tt.transaction_desc + ' ' + f.fee_type_cd
	else 
		case when isnull(bct.modify_wizard, 0) = 1 then 'Modify Wizard - ' else '' end 
			+ bill_calc_type_desc + ' ' + f.fee_type_cd
	end,
	isnull(ct.pacs_user_id, fa.pacs_user_id),
	fa.fee_adj_id,
	isnull(ct.base_amount, isnull(fa.base_amount, 0) - isnull(fa.previous_base_amount, 0)) base_amount,
	isnull(ct.base_amount, isnull(fa.base_amount, 0) - isnull(fa.previous_base_amount, 0)) base_amount,
	f.year,
	f.fee_type_cd,
	left(fa.modify_reason, 50),
	isnull(ct.batch_id, fa.batch_id)
	
from fee f with(nolock)

join fee_property_vw fpa with(nolock)
on f.fee_id = fpa.fee_id

join fee_adjustment fa with(nolock)
on f.fee_id = fa.fee_id

left join bill_calc_type bct with (nolock)
on fa.bill_calc_type_cd = bct.bill_calc_type_cd

left join coll_transaction ct with(nolock)
on f.fee_id = ct.trans_group_id 
and fa.transaction_id = ct.transaction_id

left join transaction_type tt with(nolock)
on tt.transaction_type = ct.transaction_type

where	fpa.prop_id = @input_prop_id
and	f.is_active = 1


--Payment Transactions
insert into property_audit_trail
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id    ,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason ,
	batch_id   
)
select distinct
	@input_user_id,
	@input_prop_id,
	min(ct.create_date),
	ct.transaction_type,
	tt.transaction_desc,  
	ct.pacs_user_id,
	p.payment_id,
	-1 * sum(ct.base_amount_pd),        
	-1 * sum(ct.base_amount_pd + penalty_amount_pd + interest_amount_pd + bond_interest_pd +
		+ other_amount_pd + ct.overage_amount_pd - ct.underage_amount_pd),
	b.year,
	b.bill_type,
	'',
	ct.batch_id
from bill as b with (nolock)
join coll_transaction as ct with (nolock) on 
		b.bill_id = ct.trans_group_id
join transaction_type as tt with (nolock) on 
		tt.transaction_type = ct.transaction_type
join payment_transaction_assoc as pta with (nolock) on 
		ct.transaction_id = pta.transaction_id
join payment as p with (nolock) on 
		pta.payment_id = p.payment_id
where	b.prop_id = @input_prop_id
and		b.is_active = 1
group by 
	p.payment_id, ct.transaction_type, tt.transaction_desc, ct.pacs_user_id, b.year, b.bill_type,ct.batch_id

--Fee Payment Transactions
insert into property_audit_trail
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id    ,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason,
	batch_id  
)
select distinct
	@input_user_id,
	@input_prop_id,
	min(ct.create_date),
	ct.transaction_type,
	tt.transaction_desc,  
	ct.pacs_user_id,
	p.payment_id,
	-1 * sum(ct.base_amount_pd),        
	-1 * sum(ct.base_amount_pd + penalty_amount_pd + interest_amount_pd + bond_interest_pd +
		+ other_amount_pd + ct.overage_amount_pd - ct.underage_amount_pd),
	f.year,
	f.fee_type_cd,
	'',ct.batch_id
from fee as f with (nolock)
join fee_property_vw fpa with (nolock)
on f.fee_id=fpa.fee_id
join coll_transaction as ct with (nolock) on 
		f.fee_id = ct.trans_group_id
join transaction_type as tt with (nolock) on 
		tt.transaction_type = ct.transaction_type
join payment_transaction_assoc as pta with (nolock) on 
		ct.transaction_id = pta.transaction_id
join payment as p with (nolock) on 
		pta.payment_id = p.payment_id
where	fpa.prop_id = @input_prop_id
and		f.is_active = 1
group by 
	p.payment_id, ct.transaction_type, tt.transaction_desc, ct.pacs_user_id, f.year, f.fee_type_cd,ct.batch_id

--Refund Bill Transactions       
insert into property_audit_trail
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason,
	batch_id
)
select distinct
	@input_user_id,
	@input_prop_id,
	min(ct.create_date),
	ct.transaction_type,
	tt.transaction_desc, 
	ct.pacs_user_id,
	r.refund_id,
	-1 * sum(ct.base_amount_pd),        
	-1 * sum(ct.base_amount_pd + penalty_amount_pd + interest_amount_pd + bond_interest_pd +
		+ other_amount_pd + ct.overage_amount_pd - ct.underage_amount_pd),
	b.year,
	b.bill_type,
	'',ct.batch_id
from bill as b with (nolock)
join coll_transaction as ct with (nolock) on 
		b.bill_id = ct.trans_group_id
join transaction_type as tt with (nolock) on 
		tt.transaction_type = ct.transaction_type
join refund_transaction_assoc as rta with (nolock) on 
		ct.transaction_id = rta.transaction_id
join refund as r with (nolock) on 
		rta.refund_id = r.refund_id
where	b.prop_id = @input_prop_id
	and b.is_active = 1
group by 
	r.refund_id, ct.transaction_type, tt.transaction_desc, ct.pacs_user_id, b.year, b.bill_type,ct.batch_id


-- Refund Fee Transactions       
insert into property_audit_trail
(
	pacs_user_id, 
	prop_id,     
	audit_date,                  
	type,  
	action,         
	action_user_id,
	trans_id,
	base_tax_trans_amt,
	trans_amt, 
	prop_val_yr,
	bill_type_cd,
	modify_reason,
	batch_id
)
select distinct
	@input_user_id,
	@input_prop_id,
	min(ct.create_date),
	ct.transaction_type,
	tt.transaction_desc, 
	ct.pacs_user_id,
	r.refund_id,
	-1 * sum(ct.base_amount_pd),        
	-1 * sum(ct.base_amount_pd + penalty_amount_pd + interest_amount_pd + bond_interest_pd +
		+ other_amount_pd + ct.overage_amount_pd - ct.underage_amount_pd),
	f.year,
	f.fee_type_cd,
	'',
	ct.batch_id
	
from fee f with(nolock)

join fee_property_vw fpv with(nolock)
on f.fee_id = fpv.fee_id

join coll_transaction ct with(nolock)
on f.fee_id = ct.trans_group_id

join transaction_type tt with(nolock)
on tt.transaction_type = ct.transaction_type

join refund_transaction_assoc rta with(nolock)
on ct.transaction_id = rta.transaction_id

join refund r with(nolock)
on rta.refund_id = r.refund_id

where	fpv.prop_id = @input_prop_id
and f.is_active = 1

group by r.refund_id, ct.transaction_type, tt.transaction_desc, ct.pacs_user_id, 
	f.year, f.fee_type_cd, ct.batch_id

GO

