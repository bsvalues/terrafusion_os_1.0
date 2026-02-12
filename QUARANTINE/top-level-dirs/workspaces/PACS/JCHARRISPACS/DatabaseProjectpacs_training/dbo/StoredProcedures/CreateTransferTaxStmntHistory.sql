


-----------------------------------------------------------------------------
-- Procedure: CreateTransferTaxStmntHistory
--
-- Purpose: Insert Values into the transfer_tax_stmnt_history table
-----------------------------------------------------------------------------
CREATE PROCEDURE CreateTransferTaxStmntHistory
	@input_group_id		int,
	@input_stmnt_yr		numeric(4),
	@input_run_id		int,
	@input_sup_num		int


AS
 
SET ANSI_WARNINGS OFF
  
------------------------------------------------------------------------------------------------
declare @form varchar(15)

 
  
select @form = tsfm.szDefaultForm         
    from tax_statement_forms_maint as tsfm with(nolock) 
    LEFT OUTER JOIN entity_tax_statement_run as etsr with(nolock) 
    ON etsr.levy_year   = tsfm.lTaxYr
WHERE 
    etsr.levy_group_id     = @input_group_id
AND etsr.levy_year     = @input_stmnt_yr
AND etsr.levy_sup_num = @input_sup_num
AND etsr.levy_run     = @input_run_id
AND etsr.created_date <= isnull(tsfm.dtExpire, getdate() ) 
order by lTaxYr desc, lKey desc
  
IF (@form IS NULL ) 
BEGIN
    SELECT @form=default_tax_statement_form from pacs_system with (nolock) where system_type in ('A','B')     
END--if

IF (@form IS NULL) OR (@form='Form 2005')
BEGIN 
    insert into transfer_tax_stmnt_history
    (levy_group_id,
    levy_group_yr,
    levy_run_id,
    prop_id,
    owner_id,
    sup_num,
    sup_tax_yr,
    stmnt_id,
    hist_yr,
    hist_entity_id,
    hist_entity_name,
    hist_stmnt_id,
    hist_assessed_val,
    hist_taxable_val,
    hist_tax_rate,
    hist_tax_amt,
    hist_pct_change,
    bill_id)
    
    select  distinct
    tts.levy_group_id,
    tts.levy_group_yr,
    tts.levy_run_id,		
    bill.prop_id, 
    bill.owner_id,
    bill.sup_num,
    bill.sup_tax_yr ,
    tts.stmnt_id,
    bill.sup_tax_yr as hist_yr,
    bill.entity_id  as hist_entity_id,
    substring(ac.file_as_name, 1,22) as hist_entity_name,
    bill.stmnt_id   as hist_stmnt_id,
    bill.bill_assessed_value as hist_assessed_val,
    bill.bill_taxable_val as  hist_taxable_val, 
    tax_rate.m_n_o_tax_pct + tax_rate.i_n_s_tax_pct as  hist_tax_rate, 
    bill.bill_adj_m_n_o + bill.bill_adj_i_n_s as  hist_tax_amt, 
    NULL as pct_change,  -- (Will have to be calculated) 
    bill.bill_id
    from  bill, entity with(nolock), 
    tax_rate with(nolock), 
    account ac with(nolock), 
    transfer_tax_stmnt tts with(nolock),
    entity_tax_statement_group_assoc etsga with (nolock)
    where bill.entity_id = entity.entity_id
    and   bill.entity_id = tax_rate.entity_id
    and   bill.sup_tax_yr = tax_rate.tax_rate_yr
    and   entity.entity_id = ac.acct_id 
    and   bill.prop_id    = tts.prop_id
    and   bill.sup_tax_yr BETWEEN (@input_stmnt_yr-5)  AND (@input_stmnt_yr)
    and   bill.coll_status_cd <> 'RS'
    and   bill.bill_type <> 'R' 
    and   bill.adjustment_code <> 'BPP'
    and   tts.levy_group_id = etsga.group_id
    and   bill.entity_id    = etsga.entity_id
    and   tts.levy_group_id = @input_group_id
    and   tts.levy_group_yr = @input_stmnt_yr
    and   tts.levy_run_id   = @input_run_id    
    ------------------------------------------------------------------------------------------------
    --Fix Data. If There is a tax amount > 0 and the assessed value or the taxable value is 0
    --          then set it to NULL respectively
    UPDATE transfer_tax_stmnt_history  
    SET hist_assessed_val =  CASE WHEN hist_assessed_val = 0 THEN NULL ELSE hist_assessed_val END,
        hist_taxable_val  =  CASE WHEN hist_taxable_val  = 0 THEN NULL ELSE hist_taxable_val  END
    WHERE  levy_group_id = @input_group_id
    AND   levy_group_yr  = @input_stmnt_yr
    AND   levy_run_id    = @input_run_id   
    AND   hist_tax_amt > 0
    AND   (hist_assessed_val=0 OR hist_taxable_val=0)
    ------------------------------------------------------------------------------------------------
    --UPDATE THE PERCENTAGE FOR ALL THE RECORDS IN THE HISTORY TABLE
    UPDATE transfer_tax_stmnt_history  
    SET hist_pct_change =  dbo.fn_CalculatePercentChangeInTax( levy_group_id
                                   ,levy_group_yr 
                                   ,levy_run_id   
                                   ,prop_id       
                                   ,owner_id      
                                   ,sup_num       
                                   ,sup_tax_yr    
                                   ,stmnt_id      
                                   ,hist_yr       
                                   ,hist_entity_id
                                   ,bill_id 
                                   ,hist_tax_amt  )
    WHERE  levy_group_id = @input_group_id
    and   levy_group_yr  = @input_stmnt_yr
    and   levy_run_id    = @input_run_id   
    --Insert the History Totals
    INSERT INTO transfer_tax_stmnt_history_totals
    (
    levy_group_id,
    levy_group_yr,
    levy_run_id,
    prop_id,
    owner_id,
    sup_num,
    sup_tax_yr,
    stmnt_id,
    hist_yr,
    hist_stmnt_id,
    hist_tax_rate,
    hist_tax_amnt,
    hist_pct_change 
    ) 
    SELECT DISTINCT 
    ta.levy_group_id,
    ta.levy_group_yr,
    ta.levy_run_id,
    ta.prop_id,
    ta.owner_id,
    ta.sup_num,
    ta.sup_tax_yr,
    ta.stmnt_id,
    ta.hist_yr, 
    0,
    tb.hist_tax_rate_sum,
    tb.hist_tax_amt_sum,
    tb.hist_pct_change_sum 
    FROM transfer_tax_stmnt_history ta with(nolock) ,
    ( select prop_id, sup_tax_yr,   SUM(hist_taxable_val) as hist_taxable_val_sum, 
    sum(hist_tax_rate) as hist_tax_rate_sum , 
    sum(hist_tax_amt) as hist_tax_amt_sum, 
    sum(hist_pct_change) as hist_pct_change_sum 
    FROM transfer_tax_stmnt_history with(nolock)  
    WHERE levy_group_id = @input_group_id 
     AND  levy_group_yr = @input_stmnt_yr
     AND  levy_run_id   = @input_run_id
    GROUP BY prop_id,  sup_tax_yr 
    ) tb
    
    WHERE levy_group_id = @input_group_id
     AND  levy_group_yr = @input_stmnt_yr
     AND  levy_run_id   = @input_run_id
    and tb.prop_id        = ta.prop_id
    AND tb.sup_tax_yr     = ta.sup_tax_yr 
    ORDER BY ta.prop_id, ta.SUP_TAX_YR
    
    --Calculate the values for the  transfer_tax_stmnt_fifth_yr_comparison
    INSERT INTO transfer_tax_stmnt_fifth_yr_comparison
    (
    levy_group_id,
    levy_group_yr,
    levy_run_id,
    prop_id,
    owner_id,
    sup_num,
    sup_tax_yr,
    stmnt_id,
    hist_yr,
    hist_entity_id,
    hist_stmnt_id,
    hist_entity_name,
    bill_id,
    prev_bill_id,
    hist_assessed_val,
    hist_taxable_val,
    hist_tax_rate,
    hist_tax_amt
    )
    SELECT 
    tcurrent.levy_group_id,
    tcurrent.levy_group_yr,
    tcurrent.levy_run_id,
    tcurrent.prop_id,
    tcurrent.owner_id,
    tcurrent.sup_num,
    tcurrent.sup_tax_yr,
    tcurrent.stmnt_id,
    tcurrent.hist_yr,
    tcurrent.hist_entity_id,
    tcurrent.hist_stmnt_id,
    tcurrent.hist_entity_name,  
    tcurrent.bill_id as  bill_id ,
    tprev.bill_id    as  prev_bill_id, 
    'total_assessed_val' =  CAST( dbo.fn_CalculatePercentChangeInTaxByVal( tprev.hist_assessed_val, tcurrent.hist_assessed_val) AS NUMERIC(14,2) ),
    'total_tax_value'    =  CAST( dbo.fn_CalculatePercentChangeInTaxByVal( tprev.hist_taxable_val , tcurrent.hist_taxable_val)  AS NUMERIC(14,2) ),
    'total_tax_rate'     =  CAST( dbo.fn_CalculatePercentChangeInTaxByVal( tprev.hist_tax_rate    , tcurrent.hist_tax_rate)     AS NUMERIC(14,2) ),
    'total_tax_amnt'     =  CAST( dbo.fn_CalculatePercentChangeInTaxByVal( tprev.hist_tax_amt     , tcurrent.hist_tax_amt)      AS NUMERIC(14,2))
    
    FROM transfer_tax_stmnt_history tcurrent with(nolock)
    INNER JOIN  transfer_tax_stmnt_history tprev with(nolock) ON
          tprev.levy_group_id         = tcurrent.levy_group_id
    AND   tprev.levy_group_yr         = tcurrent.levy_group_yr 
    AND   tprev.levy_run_id           = tcurrent.levy_run_id   
    AND   tprev.prop_id               = tcurrent.prop_id        
    AND   tprev.stmnt_id              = tcurrent.stmnt_id        
    AND   tprev.hist_entity_id        = tcurrent.hist_entity_id    
    
    WHERE 
    	tcurrent.sup_tax_yr = @input_stmnt_yr
    AND tprev.sup_tax_yr    = (@input_stmnt_yr - 5)
    AND tcurrent.levy_group_id = @input_group_id
    AND tcurrent.levy_group_yr = @input_stmnt_yr
    AND tcurrent.levy_run_id   = @input_run_id  

	-- Now do the school district tax rate breakdown

	declare @counter int
	declare @entity_1_name varchar(70)
	declare @entity_1_curr_yr numeric(4,0)
	declare @entity_1_curr_mno_rate numeric(13,10)
	declare @entity_1_curr_ins_rate numeric(13,10)
	declare @entity_1_curr_total_rate numeric(13,10)
	declare @entity_1_prev_yr numeric(4,0)
	declare @entity_1_prev_mno_rate numeric(13,10)
	declare @entity_1_prev_ins_rate numeric(13,10)
	declare @entity_1_prev_total_rate numeric(13,10)
	declare @entity_2_name varchar(70)
	declare @entity_2_curr_yr numeric(4,0)
	declare @entity_2_curr_mno_rate numeric(13,10)
	declare @entity_2_curr_ins_rate numeric(13,10)
	declare @entity_2_curr_total_rate numeric(13,10)
	declare @entity_2_prev_yr numeric(4,0)
	declare @entity_2_prev_mno_rate numeric(13,10)
	declare @entity_2_prev_ins_rate numeric(13,10)
	declare @entity_2_prev_total_rate numeric(13,10)
	declare @entity_3_name varchar(70)
	declare @entity_3_curr_yr numeric(4,0)
	declare @entity_3_curr_mno_rate numeric(13,10)
	declare @entity_3_curr_ins_rate numeric(13,10)
	declare @entity_3_curr_total_rate numeric(13,10)
	declare @entity_3_prev_yr numeric(4,0)
	declare @entity_3_prev_mno_rate numeric(13,10)
	declare @entity_3_prev_ins_rate numeric(13,10)
	declare @entity_3_prev_total_rate numeric(13,10)

	declare @prop_id int
	declare @prev_prop_id int
	declare @owner_id int
	declare @prev_owner_id int
	declare @sup_num int
	declare @prev_sup_num int
	declare @sup_tax_yr numeric(4,0)
	declare @prev_sup_tax_yr numeric(4,0)
	declare @stmnt_id int
	declare @prev_stmnt_id int
	declare @prev_entity_name varchar(70)
	declare @entity_name varchar(70)
	declare @curr_mno_rate numeric(13,10)
	declare @curr_ins_rate numeric(13,10)
	declare @curr_total_rate numeric(13,10)
	declare @prev_mno_rate numeric(13,10)
	declare @prev_ins_rate numeric(13,10)
	declare @prev_total_rate numeric(13,10)

	set @prev_prop_id = 0
	set @prev_owner_id = 0
	set @prev_sup_num = 0
	set @prev_sup_tax_yr = 0
	set @prev_stmnt_id = 0
	set @prev_entity_name = 'X'
	set @counter = 0

	declare cur_entity_breakdown CURSOR FAST_FORWARD
	for select ttsh.prop_id, ttsh.owner_id, ttsh.sup_num, ttsh.sup_tax_yr, ttsh.stmnt_id, 
				ttsh.hist_entity_name, tr.m_n_o_tax_pct, tr.i_n_s_tax_pct,  
				tr.m_n_o_tax_pct + tr.i_n_s_tax_pct as total_rate, 
				ptr.m_n_o_tax_pct as prev_mno_rate, ptr.i_n_s_tax_pct as prev_ins_rate,
				ptr.m_n_o_tax_pct + ptr.i_n_s_tax_pct as prev_total_rate
				from transfer_tax_stmnt_history as ttsh 
				with (nolock) 
				join entity as e 
				with (nolock) 
				on ttsh.hist_entity_id = e.entity_id 
				and e.entity_type_cd = 'S' 
				join tax_rate as tr 
				with (nolock) 
				on ttsh.hist_entity_id = tr.entity_id 
				and ttsh.hist_yr = tr.tax_rate_yr 
				left outer join tax_rate as ptr
				with (nolock)
				on ttsh.hist_entity_id = ptr.entity_id
				and ttsh.hist_yr - 1 = ptr.tax_rate_yr
				where levy_group_id = @input_group_id
				and levy_group_yr = @input_stmnt_yr
				and levy_run_id = @input_run_id
				and hist_yr = @input_stmnt_yr
	order by ttsh.prop_id, ttsh.hist_entity_name desc

	open cur_entity_breakdown

	fetch next from cur_entity_breakdown into @prop_id, @owner_id, @sup_num, @sup_tax_yr, @stmnt_id,
					@entity_name, @curr_mno_rate, @curr_ins_rate, @curr_total_rate,
					@prev_mno_rate, @prev_ins_rate, @prev_total_rate

	while @@fetch_status = 0
	begin
		if @prev_prop_id <> @prop_id
		begin
			if @prev_prop_id > 0
			begin
				insert transfer_tax_stmnt_school_breakdown
				(levy_group_id, levy_group_yr, levy_run_id, prop_id, owner_id, sup_num, sup_tax_yr,
				 stmnt_id, entity_1_name, entity_1_curr_yr, entity_1_curr_mno_rate, entity_1_curr_ins_rate,
				 entity_1_curr_total_rate, entity_1_prev_yr, entity_1_prev_mno_rate, entity_1_prev_ins_rate,
				 entity_1_prev_total_rate, entity_2_name, entity_2_curr_yr, entity_2_curr_mno_rate,
				 entity_2_curr_ins_rate, entity_2_curr_total_rate, entity_2_prev_yr, entity_2_prev_mno_rate,
				 entity_2_prev_ins_rate, entity_2_prev_total_rate, entity_3_name, entity_3_curr_yr,
				 entity_3_curr_mno_rate, entity_3_curr_ins_rate, entity_3_curr_total_rate, entity_3_prev_yr,
				 entity_3_prev_mno_rate, entity_3_prev_ins_rate, entity_3_prev_total_rate)
				values
				(@input_group_id, @input_stmnt_yr, @input_run_id, @prev_prop_id, @prev_owner_id, @prev_sup_num,
				 @input_stmnt_yr, @prev_stmnt_id, @entity_1_name, @entity_1_curr_yr, @entity_1_curr_mno_rate, @entity_1_curr_ins_rate,
				 @entity_1_curr_total_rate, @entity_1_prev_yr, @entity_1_prev_mno_rate, @entity_1_prev_ins_rate,
				 @entity_1_prev_total_rate, @entity_2_name, @entity_2_curr_yr, @entity_2_curr_mno_rate,
				 @entity_2_curr_ins_rate, @entity_2_curr_total_rate, @entity_2_prev_yr, @entity_2_prev_mno_rate,
				 @entity_2_prev_ins_rate, @entity_2_prev_total_rate, @entity_3_name, @entity_3_curr_yr,
				 @entity_3_curr_mno_rate, @entity_3_curr_ins_rate, @entity_3_curr_total_rate, @entity_3_prev_yr,
				 @entity_3_prev_mno_rate, @entity_3_prev_ins_rate, @entity_3_prev_total_rate)
			end

			set @prev_entity_name = 'X'
			set @counter = 0

			set @entity_1_name = null
			set @entity_1_curr_yr = null
			set @entity_1_curr_mno_rate = null
			set @entity_1_curr_ins_rate = null
			set @entity_1_curr_total_rate = null
			set @entity_1_prev_yr = null
			set @entity_1_prev_mno_rate = null
			set @entity_1_prev_ins_rate = null
			set @entity_1_prev_total_rate = null
			set @entity_2_name = null
			set @entity_2_curr_yr = null
			set @entity_2_curr_mno_rate = null
			set @entity_2_curr_ins_rate = null
			set @entity_2_curr_total_rate = null
			set @entity_2_prev_yr = null
			set @entity_2_prev_mno_rate = null
			set @entity_2_prev_ins_rate = null
			set @entity_2_prev_total_rate = null
			set @entity_3_name = null
			set @entity_3_curr_yr = null
			set @entity_3_curr_mno_rate = null
			set @entity_3_curr_ins_rate = null
			set @entity_3_curr_total_rate = null
			set @entity_3_prev_yr = null
			set @entity_3_prev_mno_rate = null
			set @entity_3_prev_ins_rate = null
			set @entity_3_prev_total_rate = null
		end

		if @prev_entity_name <> @entity_name
		begin
			set @counter = @counter + 1
		end

		if @counter = 1
		begin
			set @entity_1_name = @entity_name

			set @entity_1_curr_yr = @input_stmnt_yr
			set @entity_1_curr_mno_rate = @curr_mno_rate
			set @entity_1_curr_ins_rate = @curr_ins_rate
			set @entity_1_curr_total_rate = @curr_total_rate

			set @entity_1_prev_yr = @input_stmnt_yr - 1
			set @entity_1_prev_mno_rate = @prev_mno_rate
			set @entity_1_prev_ins_rate = @prev_ins_rate
			set @entity_1_prev_total_rate = @prev_total_rate
		end
		else if @counter = 2
		begin
			set @entity_2_name = @entity_name

			set @entity_2_curr_yr = @input_stmnt_yr
			set @entity_2_curr_mno_rate = @curr_mno_rate
			set @entity_2_curr_ins_rate = @curr_ins_rate
			set @entity_2_curr_total_rate = @curr_total_rate

			set @entity_2_prev_yr = @input_stmnt_yr - 1
			set @entity_2_prev_mno_rate = @prev_mno_rate
			set @entity_2_prev_ins_rate = @prev_ins_rate
			set @entity_2_prev_total_rate = @prev_total_rate
		end
		else
		begin
			set @entity_3_name = @entity_name

			set @entity_3_name = @entity_name

			set @entity_3_curr_yr = @input_stmnt_yr
			set @entity_3_curr_mno_rate = @curr_mno_rate
			set @entity_3_curr_ins_rate = @curr_ins_rate
			set @entity_3_curr_total_rate = @curr_total_rate

			set @entity_3_prev_yr = @input_stmnt_yr - 1
			set @entity_3_prev_mno_rate = @prev_mno_rate
			set @entity_3_prev_ins_rate = @prev_ins_rate
			set @entity_3_prev_total_rate = @prev_total_rate
		end

		set @prev_entity_name = @entity_name
		set @prev_prop_id = @prop_id
		set @prev_owner_id = @owner_id
		set @prev_sup_num = @sup_num
		set @prev_sup_tax_yr = @sup_tax_yr
		set @prev_stmnt_id = @stmnt_id

		fetch next from cur_entity_breakdown into @prop_id, @owner_id, @sup_num, @sup_tax_yr, @stmnt_id,
					@entity_name, @curr_mno_rate, @curr_ins_rate, @curr_total_rate,
					@prev_mno_rate, @prev_ins_rate, @prev_total_rate
	end

	close cur_entity_breakdown
	deallocate cur_entity_breakdown

	insert transfer_tax_stmnt_school_breakdown
	(levy_group_id, levy_group_yr, levy_run_id, prop_id, owner_id, sup_num, sup_tax_yr,
	 stmnt_id, entity_1_name, entity_1_curr_yr, entity_1_curr_mno_rate, entity_1_curr_ins_rate,
	 entity_1_curr_total_rate, entity_1_prev_yr, entity_1_prev_mno_rate, entity_1_prev_ins_rate,
	 entity_1_prev_total_rate, entity_2_name, entity_2_curr_yr, entity_2_curr_mno_rate,
	 entity_2_curr_ins_rate, entity_2_curr_total_rate, entity_2_prev_yr, entity_2_prev_mno_rate,
	 entity_2_prev_ins_rate, entity_2_prev_total_rate, entity_3_name, entity_3_curr_yr,
	 entity_3_curr_mno_rate, entity_3_curr_ins_rate, entity_3_curr_total_rate, entity_3_prev_yr,
	 entity_3_prev_mno_rate, entity_3_prev_ins_rate, entity_3_prev_total_rate)
	values
	(@input_group_id, @input_stmnt_yr, @input_run_id, @prev_prop_id, @prev_owner_id, @prev_sup_num,
	 @input_stmnt_yr, @prev_stmnt_id, @entity_1_name, @entity_1_curr_yr, @entity_1_curr_mno_rate, @entity_1_curr_ins_rate,
	 @entity_1_curr_total_rate, @entity_1_prev_yr, @entity_1_prev_mno_rate, @entity_1_prev_ins_rate,
	 @entity_1_prev_total_rate, @entity_2_name, @entity_2_curr_yr, @entity_2_curr_mno_rate,
	 @entity_2_curr_ins_rate, @entity_2_curr_total_rate, @entity_2_prev_yr, @entity_2_prev_mno_rate,
	 @entity_2_prev_ins_rate, @entity_2_prev_total_rate, @entity_3_name, @entity_3_curr_yr,
	 @entity_3_curr_mno_rate, @entity_3_curr_ins_rate, @entity_3_curr_total_rate, @entity_3_prev_yr,
	 @entity_3_prev_mno_rate, @entity_3_prev_ins_rate, @entity_3_prev_total_rate)
END

GO

