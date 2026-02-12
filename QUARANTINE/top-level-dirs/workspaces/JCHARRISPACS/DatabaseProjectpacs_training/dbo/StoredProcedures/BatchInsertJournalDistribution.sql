



CREATE PROCEDURE BatchInsertJournalDistribution

@input_acct		   	int,
@input_mno_amt	   	numeric(14,2),
@input_ins_amt	   		numeric(14,2),
@input_penalty_amt	  	numeric(14,2),
@input_interest_amt   		numeric(14,2),
@input_atty_fee_amt   		numeric(14,2),
@input_overages		numeric(14,2),
@input_tax_cert_fees		numeric(14,2),
@input_misc_fees		numeric(14,2),
@input_vit			numeric(14,2),
@input_check_num		int,
@input_comment		varchar(255),
@input_user_id			int,
@input_check_line1		varchar(50),
@input_check_line2		varchar(50),
@input_check_line3		varchar(50),
@input_check_line4		varchar(50),
@input_curr_mno_amt	   	numeric(14,2),
@input_curr_ins_amt	   	numeric(14,2),
@input_curr_penalty_amt	numeric(14,2),
@input_curr_interest_amt   	numeric(14,2),
@input_curr_atty_fee_amt   	numeric(14,2),
@input_curr_overages		numeric(14,2),
@input_delq_mno_amt	   	numeric(14,2),
@input_delq_ins_amt	   	numeric(14,2),
@input_delq_penalty_amt	numeric(14,2),
@input_delq_interest_amt   	numeric(14,2),
@input_delq_atty_fee_amt   	numeric(14,2),
@input_delq_overages		numeric(14,2)

as

set nocount on

insert into batch_journal_distribution
(
trans_type, 
journal_date,                                           
acct,        
m_n_o,            
i_n_s,            
penalty,          
interest,         
atty_fees,        
overages,         
tax_cert_fees,    
misc_fees,        
vit,
check_num,
comment,
pacs_user_id,
check_line1,
check_line2,
check_line3,
check_line4,
curr_mno,
curr_ins,
curr_penalty,
curr_interest,
curr_atty_fees,
curr_overages,
delq_mno,
delq_ins,
delq_penalty,
delq_interest,
delq_atty_fees,
delq_overages

)
values
(
'D',
GetDate(),
@input_acct,
-1 * @input_mno_amt,	   
-1 * @input_ins_amt,	   
-1 * @input_penalty_amt,	   
-1 * @input_interest_amt,   
-1 * @input_atty_fee_amt,   
-1 * @input_overages,
-1 * @input_tax_cert_fees,
-1 * @input_misc_fees,
-1 * @input_vit,
@input_check_num,
@input_comment,
@input_user_id,
@input_check_line1,
@input_check_line2,
@input_check_line3,
@input_check_line4,
-1 * @input_curr_mno_amt,	   
-1 * @input_curr_ins_amt,	   
-1 * @input_curr_penalty_amt,	   
-1 * @input_curr_interest_amt,   
-1 * @input_curr_atty_fee_amt,   
-1 * @input_curr_overages,
-1 * @input_delq_mno_amt,	   
-1 * @input_delq_ins_amt,	   
-1 * @input_delq_penalty_amt,	   
-1 * @input_delq_interest_amt,   
-1 * @input_delq_atty_fee_amt,   
-1 * @input_delq_overages

)

GO

