




CREATE procedure PrepCurrDelq

@input_user_id		int

as

declare @curr_tax_year			numeric(4)
declare @entity_id			int
declare @bill_id			int
declare @mno_rate			numeric(13,10)
declare @ins_rate			numeric(13,10)
declare @total_tax_rate			numeric(13,10)
declare @mno_pct			numeric(13,10)
declare @refund_paid_mno		numeric(14,2)
declare @curr_mno			numeric(14,2)
declare @curr_ins			numeric(14,2)
declare @curr_disc_mno			numeric(14,2)
declare @curr_disc_ins			numeric(14,2)
declare @curr_pen_mno			numeric(14,2)
declare @curr_pen_ins			numeric(14,2)
declare @curr_int_mno			numeric(14,2)
declare @curr_int_ins			numeric(14,2)
declare @curr_total_mno_taxes		numeric(14,2)
declare @curr_total_ins_taxes		numeric(14,2)
declare @curr_att_fees			numeric(14,2)
declare @curr_other_fees		numeric(14,2)
declare @curr_total_paid		numeric(14,2)
declare @curr_over			numeric(14,2)
declare @curr_under			numeric(14,2)
declare @curr_total_coll		numeric(14,2)
declare @curr_refunds_paid		numeric(14,2)
declare @curr_refunds_paid_mno  	numeric(14,2)
declare @curr_refunds_paid_ins		numeric(14,2)
declare @curr_refunds_paid_pen_mno  	numeric(14,2)
declare @curr_refunds_paid_pen_ins    	numeric(14,2)
declare @curr_refunds_paid_int_mno 	numeric(14,2)
declare @curr_refunds_paid_int_ins	numeric(14,2)
declare @curr_refunds_paid_atty_fee 	numeric(14,2)
declare @delq_mno			numeric(14,2)
declare @delq_ins			numeric(14,2)
declare @delq_disc_mno			numeric(14,2)
declare @delq_disc_ins			numeric(14,2)
declare @delq_pen_mno			numeric(14,2)
declare @delq_pen_ins			numeric(14,2)
declare @delq_int_mno			numeric(14,2)
declare @delq_int_ins			numeric(14,2)
declare @delq_total_mno_taxes		numeric(14,2)
declare @delq_total_ins_taxes		numeric(14,2)
declare @delq_att_fees			numeric(14,2)
declare @delq_other_fees		numeric(14,2)
declare @delq_total_paid		numeric(14,2)
declare @delq_over			numeric(14,2)
declare @delq_under			numeric(14,2)
declare @delq_total_coll		numeric(14,2)
declare @delq_refunds_paid		numeric(14,2)
declare @delq_refunds_paid_mno 		numeric(14,2)
declare @delq_refunds_paid_ins		numeric(14,2)
declare @delq_refunds_paid_pen_mno  	numeric(14,2)
declare @delq_refunds_paid_pen_ins    	numeric(14,2)
declare @delq_refunds_paid_int_mno 	numeric(14,2)
declare @delq_refunds_paid_int_ins	numeric(14,2)
declare @delq_refunds_paid_atty_fee 	numeric(14,2)
declare @total_mno			numeric(14,2)
declare @total_ins			numeric(14,2)
declare @total_disc_mno			numeric(14,2)
declare @total_disc_ins			numeric(14,2)
declare @total_pen_mno			numeric(14,2)
declare @total_pen_ins			numeric(14,2)
declare @total_int_mno			numeric(14,2)
declare @total_int_ins			numeric(14,2)
declare @total_mno_taxes		numeric(14,2)
declare @total_ins_taxes		numeric(14,2)
declare @total_att_fees			numeric(14,2)
declare @total_other_fees		numeric(14,2)
declare @total_total_paid		numeric(14,2)
declare @total_over			numeric(14,2)
declare @total_under			numeric(14,2)
declare @total_total_coll		numeric(14,2)
declare @total_refunds_paid		numeric(14,2)
declare @total_refunds_paid_mno 	numeric(14,2)
declare @total_refunds_paid_ins		numeric(14,2)
declare @total_refunds_paid_pen_mno  	numeric(14,2)
declare @total_refunds_paid_pen_ins    	numeric(14,2)
declare @total_refunds_paid_int_mno 	numeric(14,2)
declare @total_refunds_paid_int_ins	numeric(14,2)
declare @total_refunds_paid_atty_fee 	numeric(14,2)
declare @curr_gt_mno		  	numeric(14,2)
declare @curr_gt_ins		  	numeric(14,2)
declare @curr_gt_disc_mno	  	numeric(14,2)
declare @curr_gt_disc_ins	  	numeric(14,2)
declare @curr_gt_pen_mno	  	numeric(14,2)
declare @curr_gt_pen_ins	  	numeric(14,2)
declare @curr_gt_int_mno	  	numeric(14,2)
declare @curr_gt_int_ins	  	numeric(14,2)
declare @curr_gt_total_mno_taxes  	numeric(14,2)
declare @curr_gt_total_ins_taxes  	numeric(14,2)
declare @curr_gt_att_fees	  	numeric(14,2)
declare @curr_gt_other_fees	  	numeric(14,2)
declare @curr_gt_total_paid	  	numeric(14,2)
declare @curr_gt_over		  	numeric(14,2)
declare @curr_gt_under		  	numeric(14,2)
declare @curr_gt_total_coll	  	numeric(14,2)
declare @curr_gt_refunds_paid	  	numeric(14,2)
declare @curr_gt_refunds_paid_mno 	numeric(14,2)
declare @curr_gt_refunds_paid_ins 	numeric(14,2)
declare @curr_gt_refunds_paid_pen_mno 	numeric(14,2)
declare @curr_gt_refunds_paid_pen_ins   numeric(14,2)
declare @curr_gt_refunds_paid_int_mno   numeric(14,2)
declare @curr_gt_refunds_paid_int_ins	numeric(14,2)
declare @curr_gt_refunds_paid_interest 	numeric(14,2)
declare @curr_gt_refunds_paid_atty_fee 	numeric(14,2)
declare @delq_gt_mno		    	numeric(14,2)
declare @delq_gt_ins		    	numeric(14,2)
declare @delq_gt_disc_mno	    	numeric(14,2)
declare @delq_gt_disc_ins	    	numeric(14,2)
declare @delq_gt_pen_mno	    	numeric(14,2)
declare @delq_gt_pen_ins	    	numeric(14,2)
declare @delq_gt_int_mno	    	numeric(14,2)
declare @delq_gt_int_ins	    	numeric(14,2)
declare @delq_gt_total_mno_taxes    	numeric(14,2)
declare @delq_gt_total_ins_taxes    	numeric(14,2)
declare @delq_gt_att_fees	    	numeric(14,2)
declare @delq_gt_other_fees	    	numeric(14,2)
declare @delq_gt_total_paid	    	numeric(14,2)
declare @delq_gt_over		    	numeric(14,2)
declare @delq_gt_under		    	numeric(14,2)
declare @delq_gt_total_coll	    	numeric(14,2)
declare @delq_gt_refunds_paid	    	numeric(14,2)
declare @delq_gt_refunds_paid_mno   	numeric(14,2)
declare @delq_gt_refunds_paid_ins   	numeric(14,2)
declare @delq_gt_refunds_paid_pen_mno 	numeric(14,2)
declare @delq_gt_refunds_paid_pen_ins   numeric(14,2)
declare @delq_gt_refunds_paid_int_mno   numeric(14,2)
declare @delq_gt_refunds_paid_int_ins	numeric(14,2)
declare @delq_gt_refunds_paid_atty_fee 	numeric(14,2)
declare @curr_db_mno			numeric(14,2)
declare @curr_db_ins			numeric(14,2)
declare @delq_db_mno			numeric(14,2)
declare @delq_db_ins			numeric(14,2)

delete from entity_curr_delq
where pacs_user_id = @input_user_id

delete from curr_delq_grandtotals
where pacs_user_id = @input_user_id

insert into curr_delq_grandtotals
(
	pacs_user_id,
	curr_gt_mno,
	curr_gt_ins,
	curr_gt_disc_mno,
	curr_gt_disc_ins,
	curr_gt_pen_mno,
	curr_gt_pen_ins,
	curr_gt_int_mno,
	curr_gt_int_ins,
	curr_gt_total_mno_taxes,
	curr_gt_total_ins_taxes,
	curr_gt_att_fees,
	curr_gt_other_fees,
	curr_gt_total_paid,
	curr_gt_over,
	curr_gt_under,
	curr_gt_total_collected,
	curr_gt_refunds_paid_mno,
	curr_gt_refunds_paid_ins,
	curr_gt_refunds_paid_pen_mno,
	curr_gt_refunds_paid_pen_ins,
	curr_gt_refunds_paid_int_mno,
	curr_gt_refunds_paid_int_ins,
	curr_gt_refunds_paid_atty_fee,
	delq_gt_mno,
	delq_gt_ins,
	delq_gt_disc_mno,
	delq_gt_disc_ins,
	delq_gt_pen_mno,
	delq_gt_pen_ins,
	delq_gt_int_mno,
	delq_gt_int_ins,
	delq_gt_total_mno_taxes,
	delq_gt_total_ins_taxes,
	delq_gt_att_fees,
	delq_gt_other_fees,
	delq_gt_total_paid,
	delq_gt_over,
	delq_gt_under,
	delq_gt_total_collected,
	delq_gt_refunds_paid_mno,
	delq_gt_refunds_paid_ins,
	delq_gt_refunds_paid_pen_mno,
	delq_gt_refunds_paid_pen_ins,
	delq_gt_refunds_paid_int_mno,
	delq_gt_refunds_paid_int_ins,
	delq_gt_refunds_paid_atty_fee,
	total_gt_mno,
	total_gt_ins,
	total_gt_disc_mno,
	total_gt_disc_ins,
	total_gt_pen_mno,
	total_gt_pen_ins,
	total_gt_int_mno,
	total_gt_int_ins,
	total_gt_total_mno_taxes,
	total_gt_total_ins_taxes,
	total_gt_att_fees,
	total_gt_other_fees,
	total_gt_total_paid,
	total_gt_over,
	total_gt_under,
	total_gt_total_collected,
	total_gt_refunds_paid_mno,
	total_gt_refunds_paid_ins,
	total_gt_refunds_paid_pen_mno,
	total_gt_refunds_paid_pen_ins,
	total_gt_refunds_paid_int_mno,
	total_gt_refunds_paid_int_ins,
	total_gt_refunds_paid_atty_fee,
	curr_gt_db_mno,
	curr_gt_db_ins,
	curr_gt_db_pen_mno,
	curr_gt_db_pen_ins,
	curr_gt_db_int_mno,
	curr_gt_db_int_ins,
	curr_gt_db_atty_fee,
	delq_gt_db_mno,
	delq_gt_db_ins,
	delq_gt_db_pen_mno,
	delq_gt_db_pen_ins,
	delq_gt_db_int_mno,
	delq_gt_db_int_ins,
	delq_gt_db_atty_fee,
	total_gt_db_mno,
	total_gt_db_ins,
	total_gt_db_pen_mno,
	total_gt_db_pen_ins,
	total_gt_db_int_mno,
	total_gt_db_int_ins,
	total_gt_db_atty_fee
)
values
(
	@input_user_id,
	0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
)

DECLARE entity_cursor CURSOR READ_ONLY
FOR SELECT entity_id
FROM curr_delq_entity_list
WHERE pacs_user_id = @input_user_id

OPEN entity_cursor
FETCH NEXT from entity_cursor into @entity_id

WHILE (@@fetch_status = 0)
BEGIN
	insert into entity_curr_delq
	(
		entity_id, 
		pacs_user_id,
		curr_mno,
		curr_ins,
		curr_disc_mno,
		curr_disc_ins,
		curr_pen_mno,
		curr_pen_ins,
		curr_int_mno,
		curr_int_ins,
		curr_total_mno_taxes,
		curr_total_ins_taxes,
		curr_att_fees,
		curr_other_fees,
		curr_total_paid,
		curr_over,
		curr_under,
		curr_total_collected,
		curr_refunds_paid_mno,
		curr_refunds_paid_ins,
		curr_refunds_paid_pen_mno,
		curr_refunds_paid_pen_ins,
		curr_refunds_paid_int_mno,
		curr_refunds_paid_int_ins,
		curr_refunds_paid_atty_fee,
		curr_net_collected,
		delq_mno,
		delq_ins,
		delq_disc_mno,
		delq_disc_ins,
		delq_pen_mno,
		delq_pen_ins,
		delq_int_mno,
		delq_int_ins,
		delq_total_mno_taxes,
		delq_total_ins_taxes,
		delq_att_fees,
		delq_other_fees,
		delq_total_paid,
		delq_over,
		delq_under,
		delq_total_collected,
		delq_refunds_paid_mno,
		delq_refunds_paid_ins,
		delq_refunds_paid_pen_mno,
		delq_refunds_paid_pen_ins,
		delq_refunds_paid_int_mno,
		delq_refunds_paid_int_ins,
		delq_refunds_paid_atty_fee,
		delq_net_collected,
		total_mno,
		total_ins,
		total_disc_mno,
		total_disc_ins,
		total_pen_mno,
		total_pen_ins,
		total_int_mno,
		total_int_ins,
		total_mno_taxes,
		total_ins_taxes,
		total_att_fees,
		total_other_fees,
		total_total_paid,
		total_over,
		total_under,
		total_total_collected,
		total_refunds_paid_mno,
		total_refunds_paid_ins,
		total_refunds_paid_pen_mno,
		total_refunds_paid_pen_ins,
		total_refunds_paid_int_mno,
		total_refunds_paid_int_ins,
		total_refunds_paid_atty_fee,
		total_net_collected,
		curr_db_mno,
		curr_db_ins,
		curr_db_pen_mno,
		curr_db_pen_ins,
		curr_db_int_mno,
		curr_db_int_ins,
		curr_db_atty_fees,
		delq_db_mno,
		delq_db_ins,
		delq_db_pen_mno,
		delq_db_pen_ins,
		delq_db_int_mno,
		delq_db_int_ins,
		delq_db_atty_fees,
		total_db_mno,
		total_db_ins,
		total_db_pen_mno,
		total_db_pen_ins,
		total_db_int_mno,
		total_db_int_ins,
		total_db_atty_fees
	)
	values
	(
		@entity_id,
        	@input_user_id,
        	0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
	)

    	/* get the current tax year */
	select @curr_tax_year = tax_yr
	from pacs_system with (nolock)

	select
		@curr_mno 	  	= IsNull(sum(payment_trans.mno_amt),0) + IsNull(sum(payment_trans.discount_mno_amt),0),
		@curr_ins 	  	= IsNull(sum(payment_trans.ins_amt),0) + IsNull(sum(payment_trans.discount_ins_amt),0),
		@curr_db_mno		= IsNull(sum(payment_trans.mno_amt),0),
		@curr_db_ins		= IsNull(sum(payment_trans.ins_amt),0),
		@curr_disc_mno 	 	= IsNull(sum(payment_trans.discount_mno_amt),0),
		@curr_disc_ins 	 	= IsNull(sum(payment_trans.discount_ins_amt),0),
		@curr_pen_mno         	= IsNull(sum(payment_trans.penalty_mno_amt),0),
		@curr_pen_ins         	= IsNull(sum(payment_trans.penalty_ins_amt),0),
		@curr_int_mno         	= IsNull(sum(payment_trans.interest_mno_amt),0),
		@curr_int_ins         	= IsNull(sum(payment_trans.interest_ins_amt),0),
		@curr_total_mno_taxes 	= IsNull(sum(payment_trans.mno_amt + payment_trans.penalty_mno_amt + payment_trans.interest_mno_amt),0),
		@curr_total_ins_taxes 	= IsNull(sum(payment_trans.ins_amt + payment_trans.penalty_ins_amt + payment_trans.interest_ins_amt),0),
		@curr_att_fees   	= IsNull(sum(payment_trans.attorney_fee_amt),0),
		@curr_other_fees 	= IsNull(sum(payment_trans.fee_amt),0),
		@curr_total_paid 	= IsNull(sum(payment_trans.mno_amt + payment_trans.ins_amt + payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt
							+ payment_trans.interest_mno_amt + payment_trans.interest_ins_amt + payment_trans.attorney_fee_amt
							+ payment_trans.fee_amt + payment_trans.overage_mno_amt + payment_trans.overage_ins_amt),0),
		@curr_over 		 = IsNull(sum(payment_trans.overage_mno_amt),0) +  IsNull(sum(payment_trans.overage_ins_amt),0),
		@curr_under 		 = IsNull(sum(payment_trans.underage_mno_amt),0) +  IsNull(sum(payment_trans.underage_ins_amt),0),
		@curr_total_coll 	 = IsNull(sum(payment_trans.mno_amt + payment_trans.penalty_mno_amt + payment_trans.interest_mno_amt),0)
							+IsNull(sum(payment_trans.ins_amt + payment_trans.penalty_ins_amt + payment_trans.interest_ins_amt),0)
	from payment_trans with (nolock),
		payment with (nolock),
		bill with (nolock),
		batch with (nolock)
	where payment_trans.bill_id = bill.bill_id
		and payment.payment_id = payment_trans.payment_id
		and batch.batch_id = payment.batch_id
		and bill.sup_tax_yr >= @curr_tax_year
		and bill.sup_tax_yr in (select tax_year from curr_delq_year_list where pacs_user_id = @input_user_id)
		and batch.batch_id in (select batch_id from curr_delq_batch_list where pacs_user_id = @input_user_id)
		and bill.entity_id = @entity_id

	select 
		@curr_refunds_paid_mno       	= IsNull(sum(refund_trans.refund_m_n_o_pd), 0),
		@curr_refunds_paid_ins       	= IsNull(sum(refund_trans.refund_i_n_s_pd), 0),
		@curr_refunds_paid_pen_mno   	= IsNull(sum(refund_trans.refund_pen_m_n_o_pd), 0),
		@curr_refunds_paid_pen_ins 	= IsNull(sum(refund_trans.refund_pen_i_n_s_pd), 0),
		@curr_refunds_paid_int_mno  	= IsNull(sum(refund_trans.refund_int_m_n_o_pd), 0), 
		@curr_refunds_paid_int_ins    	= IsNull(sum(refund_trans.refund_int_i_n_s_pd), 0),
		@curr_refunds_paid_atty_fee  	= IsNull(sum(refund_trans.refund_atty_fee_pd), 0)
	from refund_trans with (nolock),
		refund with (nolock),
		bill with (nolock),
		batch with (nolock)
	where refund_trans.bill_id = bill.bill_id
		and refund.refund_id = refund_trans.refund_id
		and batch.batch_id = refund.batch_id
		and bill.sup_tax_yr >= @curr_tax_year
		and bill.sup_tax_yr in (select tax_year from curr_delq_year_list where pacs_user_id = @input_user_id)
		and batch.batch_id in (select batch_id from curr_delq_batch_list where pacs_user_id = @input_user_id)
		and bill.entity_id = @entity_id 
    
      	   
	select
		@delq_mno 	  	= IsNull(sum(payment_trans.mno_amt),0) + IsNull(sum(payment_trans.discount_mno_amt),0),
		@delq_ins 	  	= IsNull(sum(payment_trans.ins_amt),0) + IsNull(sum(payment_trans.discount_ins_amt),0),
		@delq_db_mno		= IsNull(sum(payment_trans.mno_amt),0),
		@delq_db_ins		= IsNull(sum(payment_trans.ins_amt),0),
		@delq_disc_mno 	 	= IsNull(sum(payment_trans.discount_mno_amt),0),
		@delq_disc_ins 	 	= IsNull(sum(payment_trans.discount_ins_amt),0),
		@delq_pen_mno  	 	= IsNull(sum(payment_trans.penalty_mno_amt),0),
		@delq_pen_ins  	 	= IsNull(sum(payment_trans.penalty_ins_amt),0),
		@delq_int_mno  	 	= IsNull(sum(payment_trans.interest_mno_amt),0),
		@delq_int_ins  	 	= IsNull(sum(payment_trans.interest_ins_amt),0),
		@delq_total_mno_taxes 	= IsNull(sum(payment_trans.mno_amt + payment_trans.penalty_mno_amt + payment_trans.interest_mno_amt),0),
		@delq_total_ins_taxes 	= IsNull(sum(payment_trans.ins_amt + payment_trans.penalty_ins_amt + payment_trans.interest_ins_amt),0),
		@delq_att_fees 	 	= IsNull(sum(payment_trans.attorney_fee_amt),0),
		@delq_other_fees 	= IsNull(sum(payment_trans.fee_amt),0),
		@delq_total_paid 	= IsNull(sum(payment_trans.mno_amt + payment_trans.ins_amt + payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt
						+ payment_trans.interest_mno_amt + payment_trans.interest_ins_amt + payment_trans.attorney_fee_amt
						+ payment_trans.fee_amt + payment_trans.overage_mno_amt + payment_trans.overage_ins_amt),0),
		@delq_over 		= IsNull(sum(payment_trans.overage_mno_amt),0) +  IsNull(sum(payment_trans.overage_ins_amt),0),
		@delq_under 		= IsNull(sum(payment_trans.underage_mno_amt),0) +  IsNull(sum(payment_trans.underage_ins_amt),0),
		@delq_total_coll 	= IsNull(sum(payment_trans.mno_amt + payment_trans.penalty_mno_amt + payment_trans.interest_mno_amt), 0)
						+ IsNull(sum(payment_trans.ins_amt + payment_trans.penalty_ins_amt + payment_trans.interest_ins_amt),0)
	from payment_trans with (nolock),
		payment with (nolock),
		bill with (nolock),
		batch with (nolock)
	where payment_trans.bill_id = bill.bill_id
	and payment.payment_id      = payment_trans.payment_id
	and batch.batch_id          = payment.batch_id
	and bill.sup_tax_yr         < @curr_tax_year
	and bill.sup_tax_yr in (select tax_year from curr_delq_year_list where pacs_user_id = @input_user_id)
	and batch.batch_id in (select batch_id from curr_delq_batch_list where pacs_user_id = @input_user_id)
	and bill.entity_id = @entity_id

	select
		@delq_refunds_paid_mno     	= IsNull(sum(refund_trans.refund_m_n_o_pd), 0),
		@delq_refunds_paid_ins       	= IsNull(sum(refund_trans.refund_i_n_s_pd), 0),
		@delq_refunds_paid_pen_mno   	= IsNull(sum(refund_trans.refund_pen_m_n_o_pd), 0),
		@delq_refunds_paid_pen_ins 	= IsNull(sum(refund_trans.refund_pen_i_n_s_pd), 0),
		@delq_refunds_paid_int_mno  	= IsNull(sum(refund_trans.refund_int_m_n_o_pd), 0), 
		@delq_refunds_paid_int_ins    	= IsNull(sum(refund_trans.refund_int_i_n_s_pd), 0),
		@delq_refunds_paid_atty_fee  	= IsNull(sum(refund_trans.refund_atty_fee_pd), 0)
	from refund_trans with (nolock),
		refund with (nolock),
		bill with (nolock),
		batch with (nolock)
	where refund_trans.bill_id = bill.bill_id
	and refund.refund_id = refund_trans.refund_id
	and batch.batch_id = refund.batch_id
	and bill.sup_tax_yr < @curr_tax_year
	and bill.sup_tax_yr in (select tax_year from curr_delq_year_list where pacs_user_id = @input_user_id)
	and batch.batch_id in (select batch_id from curr_delq_batch_list where pacs_user_id = @input_user_id)
	and bill.entity_id = @entity_id
   
	update entity_curr_delq	set
		curr_mno 			= @curr_mno,
		curr_ins 			= @curr_ins,
		curr_disc_mno 			= @curr_disc_mno,
		curr_disc_ins 			= @curr_disc_ins,
		curr_pen_mno 			= @curr_pen_mno,
		curr_pen_ins 			= @curr_pen_ins,
		curr_int_mno 			= @curr_int_mno,
		curr_int_ins 			= @curr_int_ins,
		curr_total_mno_taxes 		= @curr_total_mno_taxes,
		curr_total_ins_taxes 		= @curr_total_ins_taxes,
		curr_att_fees 			= @curr_att_fees,
		curr_other_fees 		= @curr_other_fees,
		curr_total_paid 		= @curr_total_paid,
		curr_over 			= @curr_over,
		curr_under 			= @curr_under,
		curr_total_collected 		= @curr_total_coll,
		curr_refunds_paid_mno 		= @curr_refunds_paid_mno,
		curr_refunds_paid_ins 		= @curr_refunds_paid_ins,
		curr_refunds_paid_pen_mno  	= @curr_refunds_paid_pen_mno,
		curr_refunds_paid_pen_ins    	= @curr_refunds_paid_pen_ins,
		curr_refunds_paid_int_mno   	= @curr_refunds_paid_int_mno,
		curr_refunds_paid_int_ins     	= @curr_refunds_paid_int_ins,
		curr_refunds_paid_atty_fee   	= @curr_refunds_paid_atty_fee,
		curr_net_collected 		= @curr_total_coll,
		delq_mno 			= @delq_mno,
		delq_ins 			= @delq_ins,
		delq_disc_mno 			= @delq_disc_mno,
		delq_disc_ins 			= @delq_disc_ins,
		delq_pen_mno 			= @delq_pen_mno,
		delq_pen_ins 			= @delq_pen_ins,
		delq_int_mno 			= @delq_int_mno,
		delq_int_ins 			= @delq_int_ins,
		delq_total_mno_taxes 		= @delq_total_mno_taxes,
		delq_total_ins_taxes 		= @delq_total_ins_taxes,
		delq_att_fees 			= @delq_att_fees,
		delq_other_fees 		= @delq_other_fees,
		delq_total_paid 		= @delq_total_paid,
		delq_over 			= @delq_over,
		delq_under 			= @delq_under,
		delq_total_collected 		= @delq_total_coll,
		delq_refunds_paid_mno 		= @delq_refunds_paid_mno,
		delq_refunds_paid_ins 		= @delq_refunds_paid_ins,
		delq_refunds_paid_pen_mno  	= @delq_refunds_paid_pen_mno,
		delq_refunds_paid_pen_ins    	= @delq_refunds_paid_pen_ins,
		delq_refunds_paid_int_mno   	= @delq_refunds_paid_int_mno,
		delq_refunds_paid_int_ins     	= @delq_refunds_paid_int_ins,
		delq_refunds_paid_atty_fee   	= @delq_refunds_paid_atty_fee,
		delq_net_collected 		= @delq_total_coll,
		total_mno 			= @curr_mno + @delq_mno,
		total_ins 			= @curr_ins + @delq_ins,
		total_disc_mno 			= @curr_disc_mno + @delq_disc_mno,
		total_disc_ins 			= @curr_disc_ins + @delq_disc_ins,
		total_pen_mno 			= @curr_pen_mno + @delq_pen_mno,
		total_pen_ins 			= @curr_pen_ins + @delq_pen_ins,
		total_int_mno 			= @curr_int_mno + @delq_int_mno,
		total_int_ins 			= @curr_int_ins + @delq_int_ins,
		total_mno_taxes 		= @curr_total_mno_taxes + @delq_total_mno_taxes,
		total_ins_taxes 		= @curr_total_ins_taxes + @delq_total_ins_taxes,
		total_att_fees 			= @curr_att_fees + @delq_att_fees,
		total_other_fees 		= @curr_other_fees + delq_other_fees,
		total_total_paid 		= @curr_total_paid + @delq_total_paid,
		total_over 			= @curr_over + @delq_over,
		total_under 			= @curr_under + @delq_under,
		total_total_collected 		= @curr_total_coll + @delq_total_coll,
		total_refunds_paid_mno 		= @curr_refunds_paid_mno + @delq_refunds_paid_mno,
		total_refunds_paid_ins 		= @curr_refunds_paid_ins + @delq_refunds_paid_ins,
		total_refunds_paid_pen_mno  	= @curr_refunds_paid_pen_mno + @delq_refunds_paid_pen_mno,
		total_refunds_paid_pen_ins    	= @curr_refunds_paid_pen_ins + @delq_refunds_paid_pen_ins,
		total_refunds_paid_int_mno 	= @curr_refunds_paid_int_mno + @delq_refunds_paid_int_mno,
		total_refunds_paid_int_ins 	= @curr_refunds_paid_int_ins + @delq_refunds_paid_int_ins,
		total_refunds_paid_atty_fee 	= @curr_refunds_paid_atty_fee + @delq_refunds_paid_atty_fee,
		total_net_collected 		= @curr_total_coll + @delq_total_coll,
		curr_db_mno			= (@curr_db_mno) - (@curr_refunds_paid_mno),
		curr_db_ins			= (@curr_db_ins) - (@curr_refunds_paid_ins),
		curr_db_pen_mno			= (@curr_pen_mno) - (@curr_refunds_paid_pen_mno),
		curr_db_pen_ins			= (@curr_pen_ins) - (@curr_refunds_paid_pen_ins),
		curr_db_int_mno			= (@curr_int_mno) - (@curr_refunds_paid_int_mno),
		curr_db_int_ins			= (@curr_int_ins) - (@curr_refunds_paid_int_ins),
		curr_db_atty_fees		= (@curr_att_fees) - (@curr_refunds_paid_atty_fee),
		delq_db_mno 			= (@delq_db_mno) - (@delq_refunds_paid_mno),
		delq_db_ins			= (@delq_db_ins) - (@delq_refunds_paid_ins),
		delq_db_pen_mno			= (@delq_pen_mno) - (@delq_refunds_paid_pen_mno),
		delq_db_pen_ins			= (@delq_pen_ins) - (@delq_refunds_paid_pen_ins),
		delq_db_int_mno			= (@delq_int_mno) - (@delq_refunds_paid_int_mno),
		delq_db_int_ins			= (@delq_int_ins) - (@delq_refunds_paid_int_ins),
		delq_db_atty_fees		= (@delq_att_fees) - (@delq_refunds_paid_atty_fee),
		total_db_mno 			= (@curr_db_mno + @delq_db_mno) - (@curr_refunds_paid_mno + @delq_refunds_paid_mno),
		total_db_ins			= (@curr_db_ins + @delq_db_ins) - (@curr_refunds_paid_ins + @delq_refunds_paid_ins),
		total_db_pen_mno		= (@curr_pen_mno + @delq_pen_mno) - (@curr_refunds_paid_pen_mno + @delq_refunds_paid_pen_mno),
		total_db_pen_ins		= (@curr_pen_ins + @delq_pen_ins) - (@curr_refunds_paid_pen_ins + @delq_refunds_paid_pen_ins),
		total_db_int_mno		= (@curr_int_mno + @delq_int_mno) - (@curr_refunds_paid_int_mno + @delq_refunds_paid_int_mno),
		total_db_int_ins		= (@curr_int_ins + @delq_int_ins) - (@curr_refunds_paid_int_ins + @delq_refunds_paid_int_ins),
		total_db_atty_fees		= (@curr_att_fees + @delq_att_fees) - (@curr_refunds_paid_atty_fee + @delq_refunds_paid_atty_fee)
	where pacs_user_id = @input_user_id
		and entity_id = @entity_id

	FETCH NEXT from entity_cursor into @entity_id
END

CLOSE entity_cursor
DEALLOCATE entity_cursor
      
select
	@curr_gt_mno 			= IsNull(sum(curr_mno),0),
	@curr_gt_ins 			= IsNull(sum(curr_ins),0),
	@curr_gt_disc_mno 		= IsNull(sum(curr_disc_mno),0),
	@curr_gt_disc_ins 		= IsNull(sum(curr_disc_ins),0),
	@curr_gt_pen_mno 		= IsNull(sum(curr_pen_mno),0),
	@curr_gt_pen_ins 		= IsNull(sum(curr_pen_ins),0),
	@curr_gt_int_mno 		= IsNull(sum(curr_int_mno),0),
	@curr_gt_int_ins 		= IsNull(sum(curr_int_ins),0),
	@curr_gt_total_mno_taxes 	= IsNull(sum(curr_total_mno_taxes),0),
	@curr_gt_total_ins_taxes 	= IsNull(sum(curr_total_ins_taxes),0),
	@curr_gt_att_fees 		= IsNull(sum(curr_att_fees),0),
	@curr_gt_other_fees 		= IsNull(sum(curr_other_fees),0),
	@curr_gt_total_paid 		= IsNull(sum(curr_total_paid),0),
	@curr_gt_over 			= IsNull(sum(curr_over),0),
	@curr_gt_under 			= IsNull(sum(curr_under),0),
	@curr_gt_total_coll 		=  IsNull(sum(curr_total_collected),0),
	@curr_gt_refunds_paid_mno 	= IsNull(sum(curr_refunds_paid_mno),0),
	@curr_gt_refunds_paid_ins 	= IsNull(sum(curr_refunds_paid_ins),0),
	@curr_gt_refunds_paid_pen_mno   = IsNull(sum(curr_refunds_paid_pen_mno),0),
	@curr_gt_refunds_paid_pen_ins   = IsNull(sum(curr_refunds_paid_pen_ins),0),
	@curr_gt_refunds_paid_int_mno 	= IsNull(sum(curr_refunds_paid_int_mno),0),
	@curr_gt_refunds_paid_int_ins 	= IsNull(sum(curr_refunds_paid_int_ins), 0),
	@curr_gt_refunds_paid_atty_fee 	= IsNull(sum(curr_refunds_paid_atty_fee),0),
	@delq_gt_mno 			= IsNull(sum(delq_mno),0),
	@delq_gt_ins 			= IsNull(sum(delq_ins),0),
	@delq_gt_disc_mno 		= IsNull(sum(delq_disc_mno),0),
	@delq_gt_disc_ins 		= IsNull(sum(delq_disc_ins),0),
	@delq_gt_pen_mno 		= IsNull(sum(delq_pen_mno),0),
	@delq_gt_pen_ins 		= IsNull(sum(delq_pen_ins),0),
	@delq_gt_int_mno 		= IsNull(sum(delq_int_mno),0),
	@delq_gt_int_ins 		= IsNull(sum(delq_int_ins),0),
	@delq_gt_total_mno_taxes 	= IsNull(sum(delq_total_mno_taxes),0),
	@delq_gt_total_ins_taxes 	= IsNull(sum(delq_total_ins_taxes),0),
	@delq_gt_att_fees 		= IsNull(sum(delq_att_fees),0),
	@delq_gt_other_fees 		= IsNull(sum(delq_other_fees),0),
	@delq_gt_total_paid 		= IsNull(sum(delq_total_paid),0),
	@delq_gt_over 			= IsNull(sum(delq_over),0),
	@delq_gt_under 			= IsNull(sum(delq_under),0),
	@delq_gt_total_coll 		= IsNull(sum(delq_total_collected),0),
	@delq_gt_refunds_paid_mno 	= IsNull(sum(delq_refunds_paid_mno),0),
	@delq_gt_refunds_paid_ins 	= IsNull(sum(delq_refunds_paid_ins),0),
	@delq_gt_refunds_paid_pen_mno  	= IsNull(sum(delq_refunds_paid_pen_mno),0),
	@delq_gt_refunds_paid_pen_ins  	= IsNull(sum(delq_refunds_paid_pen_ins),0),
	@delq_gt_refunds_paid_int_mno 	= IsNull(sum(delq_refunds_paid_int_mno),0),
	@delq_gt_refunds_paid_int_ins 	= IsNull(sum(delq_refunds_paid_int_ins), 0),
	@delq_gt_refunds_paid_atty_fee 	= IsNull(sum(delq_refunds_paid_atty_fee),0)
from entity_curr_delq
where pacs_user_id = @input_user_id

update curr_delq_grandtotals set
	curr_gt_mno 			= @curr_gt_mno,
	curr_gt_ins 			= @curr_gt_ins,
	curr_gt_disc_mno 		= @curr_gt_disc_mno,
	curr_gt_disc_ins 		= @curr_gt_disc_ins,
	curr_gt_pen_mno 		= @curr_gt_pen_mno,
	curr_gt_pen_ins 		= @curr_gt_pen_ins,
	curr_gt_int_mno 		= @curr_gt_int_mno,
	curr_gt_int_ins 		= @curr_gt_int_ins,
	curr_gt_total_mno_taxes 	= @curr_gt_total_mno_taxes,
	curr_gt_total_ins_taxes 	= @curr_gt_total_ins_taxes,
	curr_gt_att_fees 		= @curr_gt_att_fees,
	curr_gt_other_fees 		= @curr_gt_other_fees,
	curr_gt_total_paid 		= @curr_gt_total_paid,
	curr_gt_over 			= @curr_gt_over,
	curr_gt_under 			= @curr_gt_under,
	curr_gt_total_collected 	= @curr_gt_total_coll,
	curr_gt_refunds_paid_mno 	= @curr_gt_refunds_paid_mno,
	curr_gt_refunds_paid_ins 	= @curr_gt_refunds_paid_ins,
	curr_gt_refunds_paid_pen_mno 	= @curr_gt_refunds_paid_pen_mno,
	curr_gt_refunds_paid_pen_ins   	= @curr_gt_refunds_paid_pen_ins,
	curr_gt_refunds_paid_int_mno 	= @curr_gt_refunds_paid_int_mno,
	curr_gt_refunds_paid_int_ins   	= @curr_gt_refunds_paid_int_ins,
	curr_gt_refunds_paid_atty_fee 	= @curr_gt_refunds_paid_atty_fee,
	curr_gt_net_collected 		= @curr_gt_total_coll,
	delq_gt_mno 			= @delq_gt_mno,
	delq_gt_ins 			= @delq_gt_ins,
	delq_gt_disc_mno 		= @delq_gt_disc_mno,
	delq_gt_disc_ins 		= @delq_gt_disc_ins,
	delq_gt_pen_mno 		= @delq_gt_pen_mno,
	delq_gt_pen_ins 		= @delq_gt_pen_ins,
	delq_gt_int_mno 		= @delq_gt_int_mno,
	delq_gt_int_ins 		= @delq_gt_int_ins,
	delq_gt_total_mno_taxes 	= @delq_gt_total_mno_taxes,
	delq_gt_total_ins_taxes 	= @delq_gt_total_ins_taxes,
	delq_gt_att_fees 		= @delq_gt_att_fees,
	delq_gt_other_fees 		= @delq_gt_other_fees,
	delq_gt_total_paid 		= @delq_gt_total_paid,
	delq_gt_over 			= @delq_gt_over,
	delq_gt_under 			= @delq_gt_under,
	delq_gt_total_collected 	= @delq_gt_total_coll,
	delq_gt_refunds_paid_mno 	= @delq_gt_refunds_paid_mno,
	delq_gt_refunds_paid_ins 	= @delq_gt_refunds_paid_ins,
	delq_gt_refunds_paid_pen_mno 	= @delq_gt_refunds_paid_pen_mno,
	delq_gt_refunds_paid_pen_ins   	= @delq_gt_refunds_paid_pen_ins,
	delq_gt_refunds_paid_int_mno 	= @delq_gt_refunds_paid_int_mno,
	delq_gt_refunds_paid_int_ins   	= @delq_gt_refunds_paid_int_ins,
	delq_gt_refunds_paid_atty_fee 	= @delq_gt_refunds_paid_atty_fee,
	delq_gt_net_collected 		= @delq_gt_total_coll,
	total_gt_mno 			= @curr_gt_mno + @delq_gt_mno,
	total_gt_ins 			= @curr_gt_ins + @delq_gt_ins,
	total_gt_disc_mno 		= @curr_gt_disc_mno + @delq_gt_disc_mno,
	total_gt_disc_ins 		= @curr_gt_disc_ins + @delq_gt_disc_ins,
	total_gt_pen_mno 		= @curr_gt_pen_mno + @delq_gt_pen_mno,
	total_gt_pen_ins 		= @curr_gt_pen_ins + @delq_gt_pen_ins,
	total_gt_int_mno 		= @curr_gt_int_mno + @delq_gt_int_mno,
	total_gt_int_ins 		= @curr_gt_int_ins + @delq_gt_int_ins,
	total_gt_total_mno_taxes 	= @curr_gt_total_mno_taxes + @delq_gt_total_mno_taxes,
	total_gt_total_ins_taxes 	= @curr_gt_total_ins_taxes + @delq_gt_total_ins_taxes,
	total_gt_att_fees 		= @curr_gt_att_fees + @delq_gt_att_fees,
	total_gt_other_fees 		= @curr_gt_other_fees + delq_gt_other_fees,
	total_gt_total_paid 		= @curr_gt_total_paid + @delq_gt_total_paid,
	total_gt_over 			= @curr_gt_over + @delq_gt_over,
	total_gt_under 			= @curr_gt_under + @delq_gt_under,
	total_gt_total_collected 	= @curr_gt_total_coll + @delq_gt_total_coll,
	total_gt_refunds_paid_mno 	= @curr_gt_refunds_paid_mno + @delq_gt_refunds_paid_mno,
	total_gt_refunds_paid_ins 	= @curr_gt_refunds_paid_ins + @delq_gt_refunds_paid_ins,
	total_gt_refunds_paid_pen_mno  	= @curr_gt_refunds_paid_pen_mno + @delq_gt_refunds_paid_pen_mno,
	total_gt_refunds_paid_pen_ins 	= @curr_gt_refunds_paid_pen_ins + @delq_gt_refunds_paid_pen_ins,
	total_gt_refunds_paid_int_mno 	= @curr_gt_refunds_paid_int_mno + @delq_gt_refunds_paid_int_mno,
	total_gt_refunds_paid_int_ins 	= @curr_gt_refunds_paid_int_ins + @delq_gt_refunds_paid_int_ins,
	total_gt_refunds_paid_atty_fee 	= @curr_gt_refunds_paid_atty_fee + @delq_gt_refunds_paid_atty_fee,
	total_gt_net_collected 		= @curr_gt_total_coll + @delq_gt_total_coll
where pacs_user_id = @input_user_id

GO

