


CREATE procedure BatchChartOfAccountUpdate

@input_acct	 int,
@input_acct_id	 int,
@input_desc      varchar(100),
@input_bank_acct varchar(20),
@input_comment   varchar(200),
@input_acct_num  varchar(50),
@input_check_line1 varchar(50),
@input_check_line2 varchar(50),
@input_check_line3 varchar(50),
@input_check_line4 varchar(50),
@input_ach_deposit varchar(1)
						
as


if (@input_acct = 0)
begin

	insert into batch_chart_of_accounts
	(       
	acct_description,                                                                                          
	acct_id ,    
	bank_acct ,           
	comment,
              acct_num,
	check_line1,
	check_line2,
	check_line3,
	check_line4,
	ach_deposit                                                                                                                                                                                               
	)
	values
	(
	@input_desc,
	@input_acct_id,
	@input_bank_acct,
	@input_comment,
 	@input_acct_num,
	@input_check_line1,
	@input_check_line2,
	@input_check_line3,
	@input_check_line4,
	@input_ach_deposit
	)

end
else
begin
	update batch_chart_of_accounts
	set acct_description = @input_desc,
	    acct_id          = @input_acct_id,
	    bank_acct        = @input_bank_acct,
	    comment          = @input_comment,
	    acct_num         = @input_acct_num,
	    check_line1	  = @input_check_line1,
	    check_line2	  = @input_check_line2,
	    check_line3	  = @input_check_line3,
	    check_line4	  = @input_check_line4,
	    ach_deposit     = @input_ach_deposit
	where acct = @input_acct
end

GO

