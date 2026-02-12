




CREATE procedure SplitMOIS

@input_entity_id	int,
@input_prop_id int

as

/* this procedure assumes that no payments have been made and that all of the tax is in the
   bill_m_n_o bucket */

declare @bill_id	int
declare @orig_bill_mno	numeric(14,2)
declare @mno_rate	numeric(13,10)
declare @ins_rate	numeric(13,10)
declare @taxable_val    numeric(14,2)
declare @bill_mno	numeric(14,2)
declare @bill_ins	numeric(14,2)

declare BILL scroll cursor
for select bill_id,
	   bill_m_n_o,
	   tax_rate.m_n_o_tax_pct,
	   tax_rate.i_n_s_tax_pct
    from bill, tax_rate
    where bill.entity_id = tax_rate.entity_id
    and   bill.sup_tax_yr = tax_rate.tax_rate_yr
    and   bill.entity_id  = @input_entity_id
    and   bill.prop_id   = @input_prop_id

OPEN BILL
FETCH NEXT FROM BILL into @bill_id, @orig_bill_mno, @mno_rate, @ins_rate

while (@@FETCH_STATUS = 0)
begin
	select @taxable_val = (@orig_bill_mno * 100)/(@mno_rate + @ins_rate)
	
	select @bill_mno = (@taxable_val/100) * @mno_rate
	select @bill_ins = (@taxable_val/100) * @ins_rate

	update bill
	set bill_m_n_o = @bill_mno,
	    bill_i_n_s = @bill_ins
	where bill.bill_id = @bill_id

	FETCH NEXT FROM BILL into @bill_id, @orig_bill_mno, @mno_rate, @ins_rate
end

CLOSE BILL
DEALLOCATE BILL

GO

