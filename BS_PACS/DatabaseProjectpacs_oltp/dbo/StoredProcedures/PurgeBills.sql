

CREATE procedure PurgeBills

	@input_property_types varchar(200),
	@input_year int,
	@input_adjustment_codes varchar(200),
	@input_pacs_user_id int

as

declare @bill_id int
declare @sup_tax_yr int
declare @sup_num int
declare @entity_id int
declare @prop_id int
declare @owner_id int
declare @assessed_val numeric(14,2)
declare @taxable_val numeric(14,2)
declare @mno_pd numeric(14,2)
declare @ins_pd numeric(14,2)
declare @effective_due_dt datetime
declare @adjustment_code varchar(20)


declare @strSQL varchar(2000)

set @strSQL = 'declare PURGE_BILLS CURSOR FAST_FORWARD FOR '
set @strSQL = @strSQL + 'select bill_id, sup_tax_yr, sup_num, entity_id, '
set @strSQL = @strSQL + 'b.prop_id, owner_id, bill_assessed_value, bill_taxable_val, '
set @strSQL = @strSQL + 'bill_m_n_o_pd + discount_mno_pd + underage_mno_pd, '
set @strSQL = @strSQL + 'bill_i_n_s_pd + discount_ins_pd + underage_ins_pd, '
set @strSQL = @strSQL + 'effective_due_dt, adjustment_code '
set @strSQL = @strSQL + 'from bill as b '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'inner join property as p '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on b.prop_id = p.prop_id '
set @strSQL = @strSQL + 'and p.prop_type_cd in ('
set @strSQL = @strSQL + @input_property_types + ') '
set @strSQL = @strSQL + 'where sup_tax_yr <= ' + convert(varchar(5), @input_year) + ' '

if @input_adjustment_codes <> ''
begin
	set @strSQL = @strSQL + 'and adjustment_code not in ('
	set @strSQL = @strSQL + @input_adjustment_codes + ') '
end

set @strSQL = @strSQL + 'and active_bill = ''T'' '
set @strSQL = @strSQL + 'and coll_status_cd <> ''RS'' '
set @strSQL = @strSQL + 'and bill_adj_m_n_o + bill_adj_i_n_s - bill_m_n_o_pd - bill_i_n_s_pd '
set @strSQL = @strSQL + '- discount_mno_pd - discount_ins_pd - refund_m_n_o_pd - refund_i_n_s_pd '
set @strSQL = @strSQL + '- underage_mno_pd - underage_ins_pd - refund_disc_mno_pd - refund_disc_ins_pd > 0'

exec(@strSQL)

open PURGE_BILLS

fetch next from PURGE_BILLS into @bill_id, @sup_tax_yr, @sup_num, @entity_id,
								@prop_id, @owner_id, @assessed_val, @taxable_val,
								@mno_pd, @ins_pd, @effective_due_dt, @adjustment_code

while @@FETCH_STATUS = 0
begin
	exec ModifyBill @bill_id, 0, 'CEDD', 'Modified off old CED bill', 'MTP',
					'F', 'F', @sup_num, @sup_tax_yr, 0, @assessed_val,
					@taxable_val, @mno_pd, @ins_pd, @effective_due_dt,
					@input_pacs_user_id, @adjustment_code, @prop_id, @owner_id,
					@entity_id, 'F'

	fetch next from PURGE_BILLS into @bill_id, @sup_tax_yr, @sup_num, @entity_id,
								@prop_id, @owner_id, @assessed_val, @taxable_val,
								@mno_pd, @ins_pd, @effective_due_dt, @adjustment_code
end

close PURGE_BILLS
deallocate PURGE_BILLS

GO

