

create procedure ConvertQH

as

declare @bill_id	int
declare @bill_adj_mno	numeric(14,2)
declare @bill_adj_ins	numeric(14,2)
declare @bill_m_n_o_pd  numeric(14,2)
declare @bill_i_n_s_pd	numeric(14,2)
declare @sup_tax_yr	numeric(4)
declare @pay1_due_dt	datetime
declare @pay2_due_dt	datetime
declare @pay3_due_dt	datetime
declare @pay4_due_dt	datetime
declare @pay1_amt	numeric(14,2)
declare @pay2_amt	numeric(14,2)
declare @pay3_amt	numeric(14,2)
declare @pay4_amt	numeric(14,2)
declare @pay1_paid	numeric(14,2)
declare @pay2_paid	numeric(14,2)
declare @pay3_paid	numeric(14,2)
declare @pay4_paid	numeric(14,2)
declare @pay_type	varchar(5)
declare @discount_mno_pd numeric(14,2)
declare @discount_ins_pd numeric(14,2)

declare @amt_paid	numeric(14,2)
declare @pay_amt	numeric(14,2)

declare bill_cursor cursor fast_forward
for select bill_id,
	   bill_adj_m_n_o,
	   bill_adj_i_n_s,
	   bill_m_n_o_pd,
	   bill_i_n_s_pd,
	   sup_tax_yr,
	   pay1_due_dt,
	   pay2_due_dt,
	   pay3_due_dt,
           pay4_due_dt,
	   IsNull(pay1_amt, 0),
	   IsNull(pay2_amt, 0),
	   IsNull(pay3_amt, 0),
           IsNull(pay4_amt, 0),
           IsNull(pay1_paid, 0),
	   IsNull(pay2_paid, 0),
	   IsNull(pay3_paid, 0),
	   IsNull(pay4_paid, 0),
	   pay_type,
	   discount_mno_pd,
	   discount_ins_pd
from bill
where pay_type in ('Q', 'H')

open bill_cursor 
fetch next from bill_cursor into @bill_id,
	   @bill_adj_mno,
	   @bill_adj_ins,
	   @bill_m_n_o_pd,
	   @bill_i_n_s_pd,
	   @sup_tax_yr,
	   @pay1_due_dt,
	   @pay2_due_dt,
	   @pay3_due_dt,
           @pay4_due_dt,
	   @pay1_amt,
	   @pay2_amt,
	   @pay3_amt,
           @pay4_amt,
           @pay1_paid,
	   @pay2_paid,
	   @pay3_paid,
	   @pay4_paid,
	   @pay_type,
	   @discount_mno_pd,
	   @discount_ins_pd

while (@@FETCH_STATUS = 0)
begin

	if (@pay_type = 'Q')
	begin
		select @pay1_due_dt =  dateadd(dd, -1, '2/1/' + convert(varchar(4), (@sup_tax_yr + 1))) 
		select @pay2_due_dt =  dateadd(dd, -1, '4/1/' + convert(varchar(4), (@sup_tax_yr + 1))) 
		select @pay3_due_dt =  dateadd(dd, -1, '6/1/' + convert(varchar(4), (@sup_tax_yr + 1))) 
		select @pay4_due_dt =  dateadd(dd, -1, '8/1/' + convert(varchar(4), (@sup_tax_yr + 1))) 
	end
	else if (@pay_type = 'H')
	begin
		select @pay1_due_dt =  dateadd(dd, -1, '11/30/' + convert(varchar(4), (@sup_tax_yr))) 
		select @pay2_due_dt =  dateadd(dd, -1, '6/30/' + convert(varchar(4), (@sup_tax_yr + 1))) 
		select @pay3_due_dt =  NULL 
		select @pay4_due_dt =  NULL 
	end
	else
	begin
		select @pay1_due_dt = null
		select @pay2_due_dt = null
		select @pay3_due_dt = null
		select @pay4_due_dt = null
	end

	if (@pay_type = 'Q')
	begin
		select @pay_amt = (@bill_adj_mno + @bill_adj_ins)/4
		
		select @pay1_amt = @pay_amt
		select @pay2_amt = @pay_amt
		select @pay3_amt = @pay_amt
		select @pay4_amt = (@bill_adj_mno + @bill_adj_ins) - (@pay1_amt + @pay2_amt + @pay3_amt)

		select @amt_paid = (@bill_m_n_o_pd + @bill_i_n_s_pd + @discount_mno_pd + @discount_ins_pd)

		if (@amt_paid > @pay1_amt)
		begin
			select @pay1_paid = @pay1_amt
			select @amt_paid = @amt_paid - @pay1_amt
		end
		else
		begin
			select @pay1_paid = @amt_paid
			select @amt_paid = 0
		end

		if (@amt_paid > @pay2_amt)
		begin
			select @pay2_paid = @pay2_amt
			select @amt_paid = @amt_paid - @pay2_amt
		end
		else
		begin
			select @pay2_paid = @amt_paid
			select @amt_paid = 0
		end

		if (@amt_paid > @pay3_amt)
		begin
			select @pay3_paid = @pay3_amt
			select @amt_paid = @amt_paid - @pay3_amt
		end
		else
		begin
			select @pay3_paid = @amt_paid
			select @amt_paid = 0
		end

		if (@amt_paid > @pay4_amt)
		begin
			select @pay4_paid = @pay4_amt
			select @amt_paid = @amt_paid - @pay4_amt
		end
		else
		begin
			select @pay4_paid = @amt_paid
			select @amt_paid = 0
		end
	end
	else if (@pay_type = 'H')
	begin
		select @pay_amt = (@bill_adj_mno + @bill_adj_ins)/2
		
		select @pay1_amt = @pay_amt
		select @pay2_amt = (@bill_adj_mno + @bill_adj_ins) - (@pay1_amt)

		select @amt_paid = (@bill_m_n_o_pd + @bill_i_n_s_pd + @discount_mno_pd + @discount_ins_pd)

		if (@amt_paid > @pay1_amt)
		begin
			select @pay1_paid = @pay1_amt
			select @amt_paid = @amt_paid - @pay1_amt
		end
		else
		begin
			select @pay1_paid = @amt_paid
			select @amt_paid = 0
		end

		if (@amt_paid > @pay2_amt)
		begin
			select @pay2_paid = @pay2_amt
			select @amt_paid = @amt_paid - @pay2_amt
		end
		else
		begin
			select @pay2_paid = @amt_paid
			select @amt_paid = 0
		end
	end

	update bill
	set pay1_amt    = @pay1_amt,
	    pay1_due_dt = @pay1_due_dt,
	    pay1_paid   = @pay1_paid,
	    pay2_amt    = @pay2_amt,
	    pay2_due_dt = @pay2_due_dt,
	    pay2_paid   = @pay2_paid,
	    pay3_amt    = @pay3_amt,
	    pay3_due_dt = @pay3_due_dt,
	    pay3_paid   = @pay3_paid,
	    pay4_amt    = @pay4_amt,
	    pay4_due_dt = @pay4_due_dt,
	    pay4_paid   = @pay4_paid
	where bill_id = @bill_id

	fetch next from bill_cursor into @bill_id,
	   @bill_adj_mno,
	   @bill_adj_ins,
	   @bill_m_n_o_pd,
	   @bill_i_n_s_pd,
	   @sup_tax_yr,
	   @pay1_due_dt,
	   @pay2_due_dt,
	   @pay3_due_dt,
           @pay4_due_dt,
	   @pay1_amt,
	   @pay2_amt,
	   @pay3_amt,
           @pay4_amt,
           @pay1_paid,
	   @pay2_paid,
	   @pay3_paid,
	   @pay4_paid,
	   @pay_type,
	   @discount_mno_pd,
	   @discount_ins_pd
end

close bill_cursor
deallocate bill_cursor

GO

