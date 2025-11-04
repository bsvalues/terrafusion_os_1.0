


CREATE procedure UpdateSalesLetterDate

@input_update_flag		varchar(10),
@input_chg_of_owner_id	int,
@input_date_str			char(10)

as

if @input_update_flag = 'BUYER'
   begin
       update chg_of_owner set buyer_lttr_prt_dt = @input_date_str
       where chg_of_owner_id = @input_chg_of_owner_id
   end
else
   if @input_update_flag = 'SELLER'
      begin
         update chg_of_owner set seller_lttr_prt_dt = @input_date_str
         where chg_of_owner_id = @input_chg_of_owner_id
      end
   else
      if @input_update_flag = 'ALL'
         begin
            update chg_of_owner set buyer_lttr_prt_dt = @input_date_str, seller_lttr_prt_dt = @input_date_str
            where chg_of_owner_id = @input_chg_of_owner_id
         end

GO

