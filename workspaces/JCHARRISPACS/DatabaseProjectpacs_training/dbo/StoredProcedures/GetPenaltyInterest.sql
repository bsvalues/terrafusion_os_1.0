
CREATE   PROCEDURE GetPenaltyInterest

	@input_bill_id      		int,
	@input_show_output      	int,
	@input_delq_roll 		char(1),
	@input_effective_date      	varchar(100),
	@output_str_penalty_mno_amt  	varchar(100) OUTPUT,
	@output_str_penalty_ins_amt  	varchar(100) OUTPUT,
	@output_str_interest_mno_amt 	varchar(100) OUTPUT,
	@output_str_interest_ins_amt 	varchar(100) OUTPUT,
	@output_str_attorney_fee_amt 	varchar(100) OUTPUT

AS

--Revision History
--1.0 Creation
--1.1 06/09/2004 - ELZ; Made modifictions regarding 'R', 'S', and 'MCS' bill types with regards to the effective due date and attorney fees.
--			Optimized the stored procedure with 'set' instead of 'select' statements
--			Took out tax rate cursor and bill adjustment 'if exists' and utilized @@ROWCOUNT instead; should help performance a bit
--			Implemented 'with (nolock)' table hints where applicable to minimize blocking
--1.2 06/14/2004 - ELZ; @bill_type varchar(1) -> varchar(5)
--1.3 12/17/2004	PV	checking in the version that was ou ton comal, this version should exist on
--					all the clients. This was put on Comal for testing.

declare @bill_id    		int
declare @entity_id           	int
declare @effective_due_dt    	datetime
declare @sup_tax_yr      	numeric(4)
declare @bill_m_n_o          	numeric(14,2)
declare @bill_i_n_s      	numeric(14,2)
declare @penalty_m_n_o       	numeric(14,2)
declare @penalty_i_n_s       	numeric(14,2)
declare @attorney_fees       	numeric(14,2)
declare @bill_m_n_o_pd      	numeric(14,2)
declare @bill_i_n_s_pd       	numeric(14,2)
declare @penalty_m_n_o_pd    	numeric(14,2)
declare @penalty_i_n_s_pd    	numeric(14,2)
declare @interest_m_n_o_pd   	numeric(14,2)
declare @interest_i_n_s_pd   	numeric(14,2)
declare @attorney_fees_pd    	numeric(14,2)
declare @discount_mno_pd     	numeric(14,2)
declare @discount_ins_pd     	numeric(14,2)
declare @overage_mno_pd      	numeric(14,2)
declare @overage_ins_pd		numeric(14,2)
declare @underage_mno_pd     	numeric(14,2)
declare @underage_ins_pd	numeric(14,2)
declare @refund_m_n_o_pd     	numeric(14,2)
declare @refund_i_n_s_pd	numeric(14,2)
declare @refund_disc_mno_pd	numeric(14,2)
declare @refund_disc_ins_pd	numeric(14,2)
declare @m_n_o_tax_pct       	numeric(13,10)
declare @i_n_s_tax_pct       	numeric(13,10)
declare @prot_i_n_s_tax_pct  	numeric(13,10)
declare @statement_date      	datetime
declare @attorney_fee_date   	datetime
declare @attorney_fee_pct    	numeric(4,2)
declare @month1_int          	numeric(13,10)
declare @month1_penalty      	numeric(13,10)
declare @month2_int          	numeric(13,10)
declare @month2_penalty      	numeric(13,10)
declare @month3_int          	numeric(13,10)
declare @month3_penalty      	numeric(13,10)
declare @month4_int          	numeric(13,10)
declare @month4_penalty      	numeric(13,10)
declare @month5_int          	numeric(13,10)
declare @month5_penalty      	numeric(13,10)
declare @month6_int          	numeric(13,10)
declare @month6_penalty      	numeric(13,10)
declare @month7_int          	numeric(13,10)
declare @month7_penalty      	numeric(13,10)
declare @month8_int          	numeric(13,10)
declare @month8_penalty      	numeric(13,10)
declare @month9_int          	numeric(13,10)
declare @month9_penalty      	numeric(13,10)
declare @post_month          	int
declare @post_day            	int
declare @post_year           	int
declare @due_month           	int
declare @due_day             	int
declare @due_year            	int
declare @delinquent_month    	int
declare @delinquent_day      	int
declare @delinquent_year     	int
declare @diff_month          	int
declare @diff_year           	int
declare @discount_offered    	int
declare @bill_amount      	numeric(14,2)
declare @int_rate            	numeric(13,10)
declare @penalty_rate        	numeric(13,10)
declare @penalty_mno_amt     	numeric(14,2)
declare @penalty_ins_amt     	numeric(14,2)
declare @interest_mno_amt    	numeric(14,2)
declare @interest_ins_amt    	numeric(14,2)
declare @attorney_fee_amt    	numeric(14,2)
declare @bill_type		varchar(5)
declare @coll_status_cd		varchar(5)
declare @output_due_dt		datetime
declare @adjustment_code	varchar(10)
declare @adj_effective_date	datetime
declare @adj_expiration_date	datetime
declare @adj_penalty_rate	numeric(13,10)
declare @adj_interest_rate	numeric(13,10)
declare @adj_attorney_fee_rate  numeric(4,2)
declare @use_penalty		varchar(1)
declare @use_interest		varchar(1)
declare @use_attorney_fee	varchar(1)
declare @use_range		varchar(1)
declare @begin_range		numeric(4)
declare @end_range		numeric(4)
declare @deferral_cd		varchar(1)
declare @judgement_cd		varchar(1)
declare @adj_year		numeric(4)
declare @adj_month		int
declare @adj_post_month		int
declare @adj_post_year		numeric(4)
declare @diff_adj_year		int
declare @diff_adj_month		int
declare @stmnt_due_dt		datetime
declare @year_effective_due_dt	datetime
declare @attorney_interest_mno_amt numeric(14,2)
declare @attorney_interest_ins_amt numeric(14,2)
declare @attorney_penalty_mno_amt  numeric (14,2)
declare @attorney_penalty_ins_amt  numeric (14,2)
declare @def_expired		   varchar(1)
declare @prop_type_cd varchar(5)

set @penalty_mno_amt   = 0
set @penalty_ins_amt   = 0
set @interest_mno_amt  = 0
set @interest_ins_amt  = 0
set @attorney_fee_amt  = 0

if (@input_delq_roll = 'F')
begin
	DECLARE BILL CURSOR FAST_FORWARD FOR
	select bill.bill_id,
		bill.effective_due_dt,
		bill.entity_id,
		bill.sup_tax_yr,
		bill.bill_adj_m_n_o,
		bill.bill_adj_i_n_s,
		bill.bill_m_n_o_pd,
		bill.bill_i_n_s_pd,
		bill.penalty_m_n_o_pd,
		bill.penalty_i_n_s_pd,
		bill.interest_m_n_o_pd,
		bill.interest_i_n_s_pd,
		bill.attorney_fees_pd,
		bill.discount_mno_pd,
		bill.discount_ins_pd,
		bill.underage_mno_pd,
		bill.underage_ins_pd,
		bill.overage_mno_pd,
		bill.overage_ins_pd,
		bill.refund_m_n_o_pd,
		bill.refund_i_n_s_pd,
		bill.bill_type,
		bill.coll_status_cd,
		adjustment_code,
		adj_effective_dt,
		adj_expiration_dt,
		deferral_cd,
		judgement_cd,
		bill.refund_disc_mno_pd,
		bill.refund_disc_ins_pd,
		p.prop_type_cd	
	from bill with (nolock),
		bill_adjust_code with (nolock),
		property as p with (nolock),
		tax_rate with (nolock)
	where bill.bill_id = @input_bill_id
		and bill.entity_id = tax_rate.entity_id
		and bill.sup_tax_yr = tax_rate.tax_rate_yr
		and bill.adjustment_code = bill_adjust_code.adjust_cd
		and (((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
			((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
			(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) > 0)
		and (bill.active_bill = 'T' or bill.active_bill is null or tax_rate.collect_option = 'GS')
		and bill.prop_id = p.prop_id
end

/*
 * this is for ClientDB and PropertyAccess.  These products do not have standard PACS
 * tables like 'property', but still call GetBillTaxDue which in turn calls this procedure.
 */
else if (@input_delq_roll = 'W')
begin
	-- PropertyAccess
	if exists(select id from sysobjects where object_name(id) = '_clientdb_property')
	begin
		DECLARE BILL CURSOR FAST_FORWARD FOR
		select top 1 bill.bill_id,
			bill.effective_due_dt,
			bill.entity_id,
			bill.sup_tax_yr,
			bill.bill_adj_m_n_o,
			bill.bill_adj_i_n_s,
			bill.bill_m_n_o_pd,
			bill.bill_i_n_s_pd,
			bill.penalty_m_n_o_pd,
			bill.penalty_i_n_s_pd,
			bill.interest_m_n_o_pd,
			bill.interest_i_n_s_pd,
			bill.attorney_fees_pd,
			bill.discount_mno_pd,
			bill.discount_ins_pd,
			bill.underage_mno_pd,
			bill.underage_ins_pd,
			bill.overage_mno_pd,
			bill.overage_ins_pd,
			bill.refund_m_n_o_pd,
			bill.refund_i_n_s_pd,
			bill.bill_type,
			bill.coll_status_cd,
			adjustment_code,
			adj_effective_dt,
			adj_expiration_dt,
			deferral_cd,
			judgement_cd,
			bill.refund_disc_mno_pd,
			bill.refund_disc_ins_pd,
			p.prop_type_cd	
		from bill with (nolock),
			bill_adjust_code with (nolock),
			_clientdb_property as p with (nolock),
			tax_rate with (nolock)
		where bill.bill_id = @input_bill_id
			and bill.entity_id = tax_rate.entity_id
			and bill.sup_tax_yr = tax_rate.tax_rate_yr
			and bill.adjustment_code = bill_adjust_code.adjust_cd
			and (((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
				((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
				(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) > 0)
			and (bill.active_bill = 'T' or bill.active_bill is null or tax_rate.collect_option = 'GS')
			and bill.prop_id = p.prop_id
	end

	-- ClientDB
	else
	begin
		DECLARE BILL CURSOR FAST_FORWARD FOR
		select top 1 bill.bill_id,
			bill.effective_due_dt,
			bill.entity_id,
			bill.sup_tax_yr,
			bill.bill_adj_m_n_o,
			bill.bill_adj_i_n_s,
			bill.bill_m_n_o_pd,
			bill.bill_i_n_s_pd,
			bill.penalty_m_n_o_pd,
			bill.penalty_i_n_s_pd,
			bill.interest_m_n_o_pd,
			bill.interest_i_n_s_pd,
			bill.attorney_fees_pd,
			bill.discount_mno_pd,
			bill.discount_ins_pd,
			bill.underage_mno_pd,
			bill.underage_ins_pd,
			bill.overage_mno_pd,
			bill.overage_ins_pd,
			bill.refund_m_n_o_pd,
			bill.refund_i_n_s_pd,
			bill.bill_type,
			bill.coll_status_cd,
			adjustment_code,
			adj_effective_dt,
			adj_expiration_dt,
			deferral_cd,
			judgement_cd,
			bill.refund_disc_mno_pd,
			bill.refund_disc_ins_pd,
			case when p.prop_type_desc = 'Personal' then 'P'
				when p.prop_type_desc = 'Mobile Home' then 'MH'
				else 'X'		-- doesn't matter as P and MH are all that are relevant here.
			end as prop_type_cd	
		from bill with (nolock),
			bill_adjust_code with (nolock),
			_web_property_general as p with (nolock),
			tax_rate with (nolock)
		where bill.bill_id = @input_bill_id
			and bill.entity_id = tax_rate.entity_id
			and bill.sup_tax_yr = tax_rate.tax_rate_yr
			and bill.adjustment_code = bill_adjust_code.adjust_cd
			and (((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
				((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
				(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) > 0)
			and (bill.active_bill = 'T' or bill.active_bill is null or tax_rate.collect_option = 'GS')
			and bill.prop_id = p.prop_id
	end
end
else if (@input_delq_roll = 'T')
begin
	DECLARE BILL CURSOR FAST_FORWARD FOR
	select #delq_roll_bill.bill_id,
		#delq_roll_bill.effective_due_dt,
		#delq_roll_bill.entity_id,
		#delq_roll_bill.sup_tax_yr,
		#delq_roll_bill.bill_adj_m_n_o,
		#delq_roll_bill.bill_adj_i_n_s,
		#delq_roll_bill.bill_m_n_o_pd,
		#delq_roll_bill.bill_i_n_s_pd,
		#delq_roll_bill.penalty_m_n_o_pd,
		#delq_roll_bill.penalty_i_n_s_pd,
		#delq_roll_bill.interest_m_n_o_pd,
		#delq_roll_bill.interest_i_n_s_pd,
		#delq_roll_bill.attorney_fees_pd,
		#delq_roll_bill.discount_mno_pd,
		#delq_roll_bill.discount_ins_pd,
		#delq_roll_bill.underage_mno_pd,
		#delq_roll_bill.underage_ins_pd,
		#delq_roll_bill.overage_mno_pd,
		#delq_roll_bill.overage_ins_pd,
		#delq_roll_bill.refund_m_n_o_pd,
		#delq_roll_bill.refund_i_n_s_pd,
		#delq_roll_bill.bill_type,
		#delq_roll_bill.coll_status_cd,
		adjustment_code,
		adj_effective_dt,
		adj_expiration_dt,
		deferral_cd,
		judgement_cd,
		#delq_roll_bill.refund_disc_mno_pd,
		#delq_roll_bill.refund_disc_ins_pd,
		p.prop_type_cd
	from #delq_roll_bill with (nolock),
		bill_adjust_code with (nolock),
		property as p with (nolock)
	where #delq_roll_bill.bill_id = @input_bill_id
		and #delq_roll_bill.adjustment_code = bill_adjust_code.adjust_cd
		and (((#delq_roll_bill.bill_adj_m_n_o + #delq_roll_bill.bill_adj_i_n_s) - 
			((#delq_roll_bill.bill_m_n_o_pd + #delq_roll_bill.bill_i_n_s_pd + #delq_roll_bill.discount_mno_pd + #delq_roll_bill.discount_ins_pd + #delq_roll_bill.underage_mno_pd +  #delq_roll_bill.underage_ins_pd) - 
			(#delq_roll_bill.refund_m_n_o_pd + #delq_roll_bill.refund_i_n_s_pd + #delq_roll_bill.refund_disc_mno_pd +  #delq_roll_bill.refund_disc_ins_pd))) > 0)
		and (#delq_roll_bill.active_bill = 'T' or #delq_roll_bill.active_bill is null)
		and #delq_roll_bill.prop_id = p.prop_id
end
else if (@input_delq_roll = 'I')
begin
	DECLARE BILL CURSOR FAST_FORWARD FOR
	select #bill.bill_id,
	    	#bill.effective_due_dt,
	        #bill.entity_id,
	    	#bill.sup_tax_yr,
	        #bill.bill_adj_m_n_o,
	        #bill.bill_adj_i_n_s,
	        #bill.bill_m_n_o_pd,
	        #bill.bill_i_n_s_pd,
	        #bill.penalty_m_n_o_pd,
	    	#bill.penalty_i_n_s_pd,
	        #bill.interest_m_n_o_pd,
	        #bill.interest_i_n_s_pd,
	        #bill.attorney_fees_pd,
	    	#bill.discount_mno_pd,
	        #bill.discount_ins_pd,
	        #bill.underage_mno_pd,
		#bill.underage_ins_pd,
	        #bill.overage_mno_pd,
		#bill.overage_ins_pd,
		#bill.refund_m_n_o_pd,
		#bill.refund_i_n_s_pd,
	        #bill.bill_type,
	        #bill.coll_status_cd,
		adjustment_code,
		adj_effective_dt,
		adj_expiration_dt,
		deferral_cd,
		judgement_cd,
		#bill.refund_disc_mno_pd,
		#bill.refund_disc_ins_pd,
		p.prop_type_cd
	from #bill with (nolock),
		bill_adjust_code with (nolock),
		property as p with (nolock)
	where #bill.bill_id = @input_bill_id
		and #bill.adjustment_code = bill_adjust_code.adjust_cd
		and (((#bill.bill_adj_m_n_o + #bill.bill_adj_i_n_s) - 
			((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + #bill.discount_mno_pd + #bill.discount_ins_pd + #bill.underage_mno_pd +  #bill.underage_ins_pd) - 
			(#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd +  #bill.refund_disc_ins_pd))) > 0)
		and (#bill.active_bill = 'T' or #bill.active_bill is null)
		and #bill.prop_id = p.prop_id
end

OPEN BILL
FETCH NEXT FROM BILL into @bill_id,    
	@effective_due_dt,
	@entity_id,
	@sup_tax_yr,
	@bill_m_n_o,         
	@bill_i_n_s,     
	@bill_m_n_o_pd,      
	@bill_i_n_s_pd,       
	@penalty_m_n_o_pd,   
	@penalty_i_n_s_pd,   
	@interest_m_n_o_pd,  
	@interest_i_n_s_pd,  
	@attorney_fees_pd,
	@discount_mno_pd,
	@discount_ins_pd,
	@underage_mno_pd,
	@underage_ins_pd,
	@overage_mno_pd,
	@overage_ins_pd,
	@refund_m_n_o_pd,
	@refund_i_n_s_pd,
	@bill_type,
	@coll_status_cd,
	@adjustment_code,
	@adj_effective_date,
	@adj_expiration_date,
	@deferral_cd,
	@judgement_cd,
	@refund_disc_mno_pd,	
	@refund_disc_ins_pd,
	@prop_type_cd

if (@@FETCH_STATUS = 0)
begin	
	if (@deferral_cd is null)
	begin
		set @deferral_cd = 'F'
	end

	set @def_expired = 'F'
-- If 180 days have passed since the expiration date ,set deferral_cd to F
	if (@input_effective_date >= (@adj_expiration_date + 181))

	begin
		set @deferral_cd = 'F'
		set @def_expired = 'T'
	end


	if (@judgement_cd is null)
	begin
		set @judgement_cd = 'F'
	end

	--If the effective_due_dt > 01/31/(bill.sup_tax_yr + 1), then the bill was probably supplemented and a new effective due date
	--was placed on the bill, giving the taxpayer the 30 days to pay the bill without receiving additional penalty
	--interest, etc. However, once that 30 days is up the bill reverts back to the original p&i schedule

	--EricZ; 06/09/2004

	--DO THIS FOR NON-ROLLBACK BILLS ONLY (bill.bill_type <> 'R'); Rollback bills should accumulate P&I from new date ALWAYS
	--BEGIN
	if (isnull(@bill_type, '') not in ('R', 'S', 'MCS'))
	begin
		set @year_effective_due_dt = convert(datetime, '01/31/' + convert(varchar(4), (@sup_tax_yr + 1)))
	
		if ((@effective_due_dt > @year_effective_due_dt) and (convert(datetime, @input_effective_date) > @effective_due_dt))
		begin
			set @effective_due_dt = @year_effective_due_dt
		end
	end
	--END
	
	if ((@adj_effective_date is not null) and (@adj_effective_date <= @effective_due_dt))
	begin
		set @adj_effective_date = @effective_due_dt
	end 


	set @post_month = DATEPART(month, 	@input_effective_date)
	set @post_day   = DATEPART(day, 	@input_effective_date)
	set @post_year  = DATEPART(year, 	@input_effective_date)
	set @due_month 	= DATEPART(month, 	@effective_due_dt)
	set @due_day   	= DATEPART(day, 	@effective_due_dt)
	set @due_year  	= DATEPART(year, 	@effective_due_dt)
	
	if (@adjustment_code <> 'N') and (@adjustment_code is not null)
	begin
		select @use_penalty           	= use_penalty, 
		       @adj_penalty_rate      	= penalty_rate, 
		       @use_interest          	= use_interest, 
		       @adj_interest_rate     	= interest_rate, 
		       @use_attorney_fee      	= use_attorney_fee, 
		       @adj_attorney_fee_rate 	= attorney_fee_rate, 
		       @use_range   		= use_range,
		       @begin_range 		= begin_range, 
		       @end_range   		= end_range 
		from bill_adjust_code with (nolock)
		where adjust_cd = @adjustment_code

		if (@@ROWCOUNT > 0)
		begin
			if (@use_range is null)
			begin
				set @use_range = 'F'
			end
			
			if (@use_interest is null)
			begin
				set @use_interest = 'F'
			end

			if (@use_penalty is null)
			begin
				set @use_penalty = 'F'
			end

			if (@use_attorney_fee is null)
			begin
				set @use_attorney_fee = 'F'
			end
		
			/* if the range is true but if the post year is not in the range then we cannot
			   use the deferral code rates */
			if ((@use_range = 'T') and (@post_year < @begin_range or @post_year > @end_range))
			begin
				set @use_interest 	= 'F'
				set @use_penalty  	= 'F'
				set @use_attorney_fee 	= 'F'	
			end
			else
			begin
				--Deferral codes are some crazy stuff. We will use the interest rate from the 
				--deferral code. However we must calculated penalty, interest, atty_fees up until the
				--point the deferral code was placed on the property. Then from that point on
				--there will be no more penalty and atty fees and the interest rate will
				--accure at the deferral int rate per year		        
				if (@deferral_cd = 'T') 
				begin
					if ((@input_effective_date >= @adj_effective_date) and (@adj_expiration_date is null)) or
					   ((@input_effective_date >= @adj_effective_date) and (@input_effective_date <= ( @adj_expiration_date + 181)))-- added 181 so regular P & I kicks in after 180 days
					begin
					
						set @post_month 	= DATEPART(month, 	@adj_effective_date)
						set @post_day   	= DATEPART(day, 	@adj_effective_date)
						set @post_year  	= DATEPART(year, 	@adj_effective_date)
					end
					else
					begin
						set @use_interest 	= 'F'
						set @use_penalty  	= 'F'
						set @use_attorney_fee 	= 'F'	
					end
				end
						
			end
		end
	end
	else
	begin
		set @use_interest 	= 'F'
		set @use_penalty  	= 'F'
		set @use_attorney_fee 	= 'F'
	end

	set @diff_year = @post_year - @due_year  

	-- HS 31663 Personal Property Attorney Fee Change
	-- Logic to determine which date to use to deduce attorney fees
	-- 1)If the property on the bill is a personal property
	-- then 
	-- 1.a) check if apply_bpp_personal_fees is set on the entity tax rate for that particular year
	-- 1.b) If yes Then use the tax_rate.bpp_attorney_fee_dt instead of tax_rate.attorney_fee_dt
	-- 2) Else use tax_rate.attorney_fee_dt

	-- Included 'MH' properties also for HS 33593, Sai K on 02/06/06

	select @m_n_o_tax_pct 		= tax_rate.m_n_o_tax_pct,
		@i_n_s_tax_pct 		= tax_rate.i_n_s_tax_pct,
		@prot_i_n_s_tax_pct 	= tax_rate.prot_i_n_s_tax_pct,
		@statement_date 	= tax_rate.stmnt_dt,
		--@attorney_fee_date 	= tax_rate.attorney_fee_dt,
		@attorney_fee_date = 
		CASE WHEN @prop_type_cd in ('P', 'MH')
/*
		 	WHEN EXISTS (
				SELECT * 
				FROM bill
				with (nolock)
				INNER JOIN property AS p
						ON bill.bill_id = @bill_id
						AND bill.prop_id = p.prop_id
				WHERE 
					p.prop_type_cd in ('P', 'MH')
				)
*/
			THEN
			    CASE 
				WHEN ISNULL(tax_rate.apply_bpp_attorney_fees, 0) = 1
				THEN tax_rate.bpp_attorney_fee_dt
				ELSE tax_rate.attorney_fee_dt
			    END
			ELSE
 			   tax_rate.attorney_fee_dt
		END,			
		@attorney_fee_pct 	= tax_rate.attorney_fee_pct,
		@month1_penalty 	= tax_rate.plus_1_penalty_pct,
		@month1_int 		= tax_rate.plus_1_int_pct,
		@month2_penalty 	= tax_rate.plus_2_penalty_pct,
		@month2_int 		= tax_rate.plus_2_int_pct,
		@month3_penalty 	= tax_rate.plus_3_penalty_pct,
		@month3_int 		= tax_rate.plus_3_int_pct,
		@month4_penalty 	= tax_rate.plus_4_penalty_pct,
		@month4_int 		= tax_rate.plus_4_int_pct,
		@month5_penalty 	= tax_rate.plus_5_penalty_pct,
		@month5_int 		= tax_rate.plus_5_int_pct,
		@month6_penalty 	= tax_rate.plus_6_penalty_pct,
		@month6_int 		= tax_rate.plus_6_int_pct,
		@month7_penalty 	= tax_rate.plus_7_penalty_pct,
		@month7_int 		= tax_rate.plus_7_int_pct,
		@month8_penalty 	= tax_rate.plus_8_penalty_pct,
		@month8_int 		= tax_rate.plus_8_int_pct,
		@month9_penalty 	= tax_rate.plus_9_penalty_pct,
		@month9_int 		= tax_rate.plus_9_int_pct,
		@stmnt_due_dt 		= effective_due_dt
	from tax_rate with (nolock)
	where tax_rate.entity_id = @entity_id
		and tax_rate.tax_rate_yr = @sup_tax_yr	

	if (@@ROWCOUNT > 0)
	begin
		--If bill is of type 'R', 'S', or 'MCS', fetch the attorney fee information from the tax rate info for year (effective_due_date year - 1)
		if (isnull(@bill_type, '') in ('R', 'S', 'MCS'))
		begin
			select @attorney_fee_date = tax_rate.attorney_fee_dt,
				@attorney_fee_pct = tax_rate.attorney_fee_pct
			from tax_rate with (nolock)
			where tax_rate.entity_id = @entity_id
				and tax_rate.tax_rate_yr = (@due_year - 1)
		end

		if (@month1_penalty < 0)
		begin
   			set @discount_offered = 1
		end
		else
		begin
   			set @discount_offered = 0
		end
		  
		--Calculate the difference in months between the statement date and the current date
   
		if (@diff_year < 0)
   		begin
      			set @diff_month = ((12 - @post_month) + @due_month) * -1
   		end
		if (@diff_year = 0)
   		begin
      			set @diff_month = @post_month - @due_month
   		end
		else if (@diff_year = 1)
   		begin
      			set @diff_month = (12 - @due_month) + @post_month
   		end
		else if (@diff_year >= 2)
   		begin
      			set @diff_month = (12 - @due_month) + @post_month + ((@diff_year - 1) * 12)
   		end

		--Based on the difference in month assign an interest rate and penalty rate
		if (@diff_month <= -3)
   		begin
      			if (@discount_offered = 1) and ((@bill_type =  'L') or (@bill_type <> 'L' and @effective_due_dt <= @stmnt_due_dt))
      			begin
         			set @int_rate = 0
         			set @penalty_rate = -3
      			end
      			else
      			begin
         			set @int_rate = 0
         			set @penalty_rate = 0
      			end
   		end
		else if (@diff_month = -2) and ((@bill_type =  'L') or (@bill_type <> 'L' and @effective_due_dt <= @stmnt_due_dt))
   		begin
      			if (@discount_offered = 1)
      			begin
         			set @int_rate = 0
         			set @penalty_rate = -2
      			end
      			else
      			begin
         			set @int_rate = 0
         			set @penalty_rate = 0
      			end
   		end
      
		else if (@diff_month <= -1) and ((@bill_type =  'L') or (@bill_type <> 'L' and @effective_due_dt <= @stmnt_due_dt))
   		begin
      			if (@discount_offered = 1)
      			begin
         			set @int_rate = 0
         			set @penalty_rate = -1
      			end
      			else
      			begin
         			set @int_rate = 0
         			set @penalty_rate = 0
      			end
   		end
		else if (@diff_month < 0) and (@bill_type <> 'L')
		begin
			set @int_rate = 0
			set @penalty_rate = 0
		end
		else if (@diff_month = 0)
   		begin
      			set @int_rate = 0
      			set @penalty_rate = 0

 			if (@input_effective_date > @effective_due_dt) and
                                         ((@deferral_cd <> 'T') or (@deferral_cd = 'T' and @use_interest = 'F' and @use_penalty = 'F' and @use_attorney_fee = 'F'))
			begin
				set @int_rate = 1
				set @penalty_rate = 6
			end
		end
   
		else if (@diff_month = 1)
   		begin
      			set @int_rate = 1
      			set @penalty_rate = 6
   		end
      
		else if (@diff_month = 2)
   		begin
      			set @int_rate = 2
      			set @penalty_rate = 7
   		end
      
		else if (@diff_month = 3)
   		begin
      			set @int_rate = 3
      			set @penalty_rate = 8 
   		end
		else if (@diff_month = 4)
   		begin
      			set @int_rate = 4
      			set @penalty_rate = 9
   		end
      
		else if (@diff_month = 5)
   		begin
      			set @int_rate = 5
      			set @penalty_rate = 10
   		end

		--If the bill hasn't been paid by now then it is big time delinquent. At this stage the penalty will 
   		--stay constant at some percentage and the int_rate will continue to accrue at 1% per month. To make this calculation
   		--simple I take the diff in months between the statement date & the current date - subtract out the discount months
   		--and multiply by 1.
		else if (@diff_month >= 6)
   		begin
      			set @int_rate = @diff_month

				-- 2006.01.20 - Jeremy Smith - HS 31664 - Interest Change for Late Installments
				-- Get the interest rate based on the payment due year
				--declare @rate_output as int
				--exec GetPenaltyInterestRate @due_year, @rate_output output
				set @penalty_rate = 12

   		end 

  		if (@use_penalty = 'T')
		begin
			set @penalty_rate = @adj_penalty_rate
		end
	-- added @def_expired <>'T' for the P&I calculation after def expires
		if ((@use_interest = 'T') and (@deferral_cd <> 'T') and @def_expired <>'T')
		begin
			set @int_rate = @adj_interest_rate

		end

		if (@use_attorney_fee = 'T')
		begin
			set @attorney_fee_pct = @adj_attorney_fee_rate
		end	

		set @bill_amount =  ((@bill_m_n_o + @bill_i_n_s) - 
                 		  ((@bill_m_n_o_pd + @bill_i_n_s_pd + @discount_mno_pd + @discount_ins_pd + @underage_mno_pd +  @underage_ins_pd) - 
		 		  (@refund_m_n_o_pd + @refund_i_n_s_pd))) 

		if (@bill_amount > 0)
		begin

		       if (@deferral_cd = 'T')
		       begin

				-- added these for the deferral calulations as AF need to freeze one day before def date
				set @attorney_interest_mno_amt = ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd))) * (@int_rate /100)
	   			set @attorney_interest_ins_amt = ((@bill_i_n_s) - ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd))) * (@int_rate /100)
				set @attorney_penalty_mno_amt = ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd))) * (@penalty_rate/100)
	   			set @attorney_penalty_ins_amt = ((@bill_i_n_s) - ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd))) * (@penalty_rate/100)	
	
	
				--calc AF if the def date > AF date 	
				if((@adj_effective_date >= @attorney_fee_date and @input_effective_date>=@attorney_fee_date) and @deferral_cd = 'T')
					begin 
	 
	           		 		set @attorney_fee_amt = ((@bill_amount + @attorney_penalty_mno_amt + @attorney_penalty_ins_amt + @attorney_interest_mno_amt + @attorney_interest_ins_amt) * (@attorney_fee_pct/100))
					end
		
	        
	
				-- For deferral we need to subtract 1 from the int rate, becoz we get the regular int for the prior month		
				if ((@input_effective_date >= @adj_effective_date) and ( @input_effective_date >= @effective_due_dt) and @deferral_cd = 'T')
	  			begin
	   				if (@int_rate > 0)
	   				begin
	    					set @int_rate = (@int_rate - 1)
	   				end
	  			end
				
				--subtract 1 from penalty if the def date is the first of the month only and for current year bills only
				if ((day(@adj_effective_date) = 1) and (@input_effective_date >= @adj_effective_date) and ( @input_effective_date>=@effective_due_dt) and @deferral_cd = 'T')
				begin
	
					if (@penalty_rate > 0 and month(@adj_effective_date) < 8 and year(@adj_effective_date)  = year (@effective_due_dt))
	   				begin
	    					set @penalty_rate = (@penalty_rate - 1)
	   				end
				--if its feb and current year , then set penalty to 0
					if ((month(@adj_effective_date)= 2) and (year(@adj_effective_date)= year (@effective_due_dt)) and (day(@adj_effective_date) =1) )
					begin
						set  @penalty_rate = 0 
						
					end
					
				end		
			end				

			set @interest_mno_amt = ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd))) * (@int_rate/100)
   			set @interest_ins_amt = ((@bill_i_n_s) - ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd))) * (@int_rate/100)

			set @penalty_mno_amt = ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd))) * (@penalty_rate/100)
   			set @penalty_ins_amt = ((@bill_i_n_s) - ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd))) * (@penalty_rate/100)

					 

			--If use interest and deferral_cd we must now calculate the interest for the deferral
			--interest rate which will be deferral interest rate * # years
			if (@use_interest = 'T')
			begin

				if (@deferral_cd = 'T')
				begin
		--get the the number of months between the posting day and the def date
					set @diff_adj_month = (datediff(mm,@adj_effective_date,@input_effective_date)) 

					if (@adj_effective_date <= @effective_due_dt and @input_effective_date >= @effective_due_dt)
						begin 
							set @diff_adj_month =  @diff_adj_month
	
						end
    					else 
						begin 
							set @diff_adj_month =  @diff_adj_month + 1
					end
					


					set @interest_mno_amt = @interest_mno_amt + ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd)))
           					* ((((@adj_interest_rate/12) * (@diff_adj_month )))/100)
      					set @interest_ins_amt = @interest_ins_amt + ((@bill_i_n_s) -  ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd)))
           					* ((((@adj_interest_rate/12) * (@diff_adj_month )))/100)

					
				end
				else if (@judgement_cd = 'T')
				begin
					--If @judgement_cd = 'T' ignore any previous interest_mno calculated
					select @interest_mno_amt = 0
					select @interest_ins_amt   = 0

					--With grayson cad have to count start moth so add 1 to @diff_month
					if (@diff_month + 1>= 0)
					begin
						set @interest_mno_amt = @interest_mno_amt + ((@bill_m_n_o) - ((@bill_m_n_o_pd + @discount_mno_pd + @underage_mno_pd) - (@refund_m_n_o_pd + @refund_disc_mno_pd)))
                                                                                       * (((@adj_interest_rate/100)/12) * (@diff_month + 1))
						set @interest_ins_amt = @interest_ins_amt + ((@bill_i_n_s) - ((@bill_i_n_s_pd + @discount_ins_pd + @underage_ins_pd) - (@refund_i_n_s_pd + @refund_disc_ins_pd)))
                                                                                        * (((@adj_interest_rate/100)/12) * (@diff_month + 1))
					end
				end
										
			end

			
			if (@deferral_cd <> 'T')
   			begin
				--check to see if the current date is greater than the attorney fee date, if so tack on attorney fees
	   			if (((@input_effective_date >= @attorney_fee_date) and (@attorney_fee_date >= @effective_due_dt))
				 	or ((@effective_due_dt > @attorney_fee_date) and (@input_effective_date > @effective_due_dt))
	 			 	or (@diff_month > 0 and @use_attorney_fee = 'T')) 
	   			begin
					--do not calculate atty fees if the deferral code has not expired. if @deferral_cd = 'T' and @use_interest = 'T'
					--then the deferral code has not expired

				       	set @attorney_fee_amt = ((@bill_amount + @penalty_mno_amt + @penalty_ins_amt + @interest_mno_amt + @interest_ins_amt) * (@attorney_fee_pct/100))
	   				
				end
			end

			
		end
		else
		begin
   			set @penalty_mno_amt   = 0
   			set @penalty_ins_amt   = 0
   			set @interest_mno_amt  = 0
   			set @interest_ins_amt  = 0
   			set @attorney_fee_amt  = 0
		end
	end
end

set @output_str_penalty_mno_amt = convert(varchar(100), @penalty_mno_amt)
set @output_str_penalty_ins_amt = convert(varchar(100), @penalty_ins_amt)
set @output_str_interest_mno_amt = convert(varchar(100), @interest_mno_amt)
set @output_str_interest_ins_amt = convert(varchar(100), @interest_ins_amt)
set @output_str_attorney_fee_amt = convert(varchar(100), @attorney_fee_amt) 

if (@input_show_output = 1)
begin
	select bill_id 	= @bill_id, 

		penalty_mno  	= @output_str_penalty_mno_amt,
		penalty_ins  	= @output_str_penalty_ins_amt, 
		interest_mno 	= @output_str_interest_mno_amt,
		interest_ins 	= @output_str_interest_ins_amt,
		attorney_fee 	= @output_str_attorney_fee_amt
end

CLOSE BILL
DEALLOCATE BILL

return 0

GO

