
create proc WACreateSupplementalLevyStatementRunData
	@runType char(1),
	@supGroupID int,
	@taxStatementDatasetID_BillIDLevy bigint,
	@taxStatementDatasetID_BillIDAssessment bigint,
	@taxStatementDatasetID_FeeID bigint

as
	/* Top of each procedure to capture input parameters */
	set nocount on
	declare @StartProc datetime
		set @StartProc = getdate()
	declare @StartStep datetime
	declare @LogTotRows int
	declare @LogStatus varchar(200)
	declare @LogErrCode int
	declare @qry varchar(1000)
	declare @proc varchar(100)
	declare @oldDatasetIds table(dataset_id int)
	set @proc = object_name(@@procid)
	
	
	--Delete old records from tax_statement_idlist table
	insert into @oldDatasetIds(dataset_id)
	(select dataset_id from 
	tax_statement_idlist_log with (nolock) 
	where DATEDIFF(DAY, datecreated, GETDATE()) > 1)
	
	delete from tax_statement_idlist where dataset_id in 
	(select dataset_id from @oldDatasetIds)
    
    delete from tax_statement_idlist_log where 
    DATEDIFF(DAY, datecreated, GETDATE()) > 180
	
	set @qry = 'Start - ' + @proc  
	 + ' @runType =' +  convert(varchar(30),@runType) + ','
	 + ' @supGroupID =' +  convert(varchar(30),@supGroupID)
	 
	exec dbo.CurrentActivityLogInsert @proc, @qry
	 
	-- set variable for final status entry
	set @qry = @qry + ' Total Duration in secs: '
	set @qry = Replace(@qry,'Start','End')
	 
	/* End top of each procedure to capture parameters */

	declare @sql varchar(max)


	--------------------------------------------------------------
	-- build extra query sub-clauses for supplemental run types --
	--------------------------------------------------------------
	declare @suppJoinBill varchar(max),
			@suppJoinFee varchar(max)

	if @runType = 'S'
	begin
		set @suppJoinBill =
			'
				left outer join min_bill_adj_vw as mbav with(nolock) on
					mbav.bill_id = b.bill_id
				left outer join bill_adjustment as ba with(nolock) on
					b.created_by_type_cd = ''SUP'' and
					ba.bill_id = mbav.bill_id and
					ba.bill_adj_id = mbav.bill_adj_id and
					ba.bill_calc_type_cd = ''SM''
				left outer join supplement with(nolock) on
					supplement.sup_tax_yr = b.year and
					supplement.sup_num = ba.sup_num and
					supplement.sup_group_id = '
			+
			convert(varchar, @supGroupID)
			+
			'
				left outer join property_val as pv with(nolock) on
					pv.prop_val_yr = b.year and
					pv.sup_num = supplement.sup_num and
					pv.prop_id = b.prop_id
				left outer join supplement_type as st with(nolock) on
					st.sup_type_cd = pv.sup_cd
			'

		set @suppJoinFee =
			'
				left outer join min_fee_adj_vw as mfav with(nolock) on
					mfav.fee_id = f.fee_id
				left outer join fee_adjustment as fa with(nolock) on
					f.sup_num > 0 and
					fa.fee_id = mfav.fee_id and
					fa.fee_adj_id = mfav.fee_adj_id and
					fa.bill_calc_type_cd = ''SM''
				left outer join supplement with(nolock) on
					supplement.sup_tax_yr = f.year and
					supplement.sup_num = fa.sup_num and
					supplement.sup_group_id = '
			+
			convert(varchar, @supGroupID)
			+
			'
				left outer join property_val as pv with(nolock) on
					pv.prop_val_yr = f.year and
					pv.sup_num = supplement.sup_num and
					pv.prop_id = fpv.prop_id
				left outer join supplement_type as st with(nolock) on
					st.sup_type_cd = pv.sup_cd
			'
	end
	else
	begin
		set @suppJoinBill = ''
		set @suppJoinFee = ''
	end


	-------------------------------------------------
	-- allocate the unique IDs we're going to need --
	-------------------------------------------------
	declare @taxStatementDatasetID_FullPayBill bigint,
			@taxStatementDatasetID_HalfPayBill bigint,
			@taxStatementDatasetID_FullPayFee bigint,
			@taxStatementDatasetID_HalfPayFee bigint

	exec dbo.GetUniqueID 'tax_statement_idlist', @taxStatementDatasetID_FullPayBill output, 4, 0
	set @taxStatementDatasetID_HalfPayBill = @taxStatementDatasetID_FullPayBill + 1
	set @taxStatementDatasetID_FullPayFee = @taxStatementDatasetID_FullPayBill + 2
	set @taxStatementDatasetID_HalfPayFee = @taxStatementDatasetID_FullPayBill + 3
	
	
	--Add ID's to log table to delete old unprocessed records in case process fails
	if not exists (select dataset_id from tax_statement_idlist_log where dataset_id in 
	(@taxStatementDatasetID_FullPayBill,@taxStatementDatasetID_HalfPayBill,
	@taxStatementDatasetID_FullPayFee,@taxStatementDatasetID_HalfPayFee))
	begin
	INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
    VALUES (@taxStatementDatasetID_FullPayBill,GETDATE())
   
    INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
    VALUES (@taxStatementDatasetID_HalfPayBill,GETDATE())
    
    INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
    VALUES (@taxStatementDatasetID_FullPayFee,GETDATE())
    
    INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
    VALUES (@taxStatementDatasetID_HalfPayFee,GETDATE())
   end
	


	-------------------------------------------
	-- Build a list of bill IDs for full pay --
	-------------------------------------------

	-- properties whose total amount due on the statement we are generating
	-- (all bills and fees) is at least $50 will get half pay (2 payments due)
	-- on all bills but only on fees marked as allowing half pay
	set @sql =
		'
		insert tax_statement_idlist(dataset_id, id)
		select distinct '
		+
		convert(varchar, @taxStatementDatasetID_FullPayBill)
		+
		', tsil.id
		from tax_statement_idlist as tsil with(nolock)
		join bill as b with(nolock) on
			b.bill_id = tsil.id
		join (
			select distinct dues.prop_id, total_base_due = sum(base_due)
			from (
				select b.prop_id, base_due = isnull(b.current_amount_due, 0)
				from tax_statement_idlist as tsilb with(nolock)
				join bill as b with(nolock) on b.bill_id = tsilb.id
				where tsilb.dataset_id in ('
		+
		convert(varchar, @taxStatementDatasetID_BillIDLevy)
		+
		','
		+
		convert(varchar, @taxStatementDatasetID_BillIDAssessment)
		+
		')
				union all
				select fpv.prop_id, base_due = isnull(f.current_amount_due, 0)
				from tax_statement_idlist as tsilf with(nolock)
				join fee as f with(nolock) on f.fee_id = tsilf.id
				join fee_property_vw as fpv with(nolock) on fpv.fee_id = f.fee_id
				where tsilf.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FeeID)
		+
		'
			) as dues
			group by dues.prop_id
		) as fullpay on
			fullpay.prop_id = b.prop_id
		left join bill_fee_code bfc with (nolock)
			on bfc.bill_fee_cd = b.code
		'
		+
		@suppJoinBill
		+
		'
		where tsil.dataset_id in ('
		+
		convert(varchar, @taxStatementDatasetID_BillIDLevy)
		+
		','
		+
		convert(varchar, @taxStatementDatasetID_BillIDAssessment)
		+
		')
		and ((total_base_due < 50.00'
		+
		case when @suppJoinBill <> '' then ' or st.supp_attribute in (5,6)' else '' end
		+
		')
		or isNull(bfc.force_full_pay, 0) = 1)
		order by tsil.id asc
		'

	exec (@sql)


	-- must also force as FULL all assessments which simply do not permit half payment to occur

	set @sql =
		'
		insert tax_statement_idlist(dataset_id, id)
		select distinct '
		+
		convert(varchar, @taxStatementDatasetID_FullPayBill)
		+
		', tsil.id
		from tax_statement_idlist as tsil with(nolock)		
		join bill as b with(nolock) on
		b.bill_id = tsil.id		
		left outer join assessment_bill as ab with(nolock) on
		ab.bill_id = b.bill_id
		left outer join special_assessment_statement_options as saso with (nolock) on
		saso.agency_id = ab.agency_id and
		saso.year = ab.year		
		left join tax_statement_idlist tsil2    
		on tsil2.id = tsil.id and    
		tsil2.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FullPayBill)
		+
		'      
		where tsil.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_BillIDAssessment)	
		+
		'and saso.eligible_for_half_pay = 0
		and tsil2.id is null'
		
	exec (@sql)				

	-------------------------------------------
	-- Build a list of bill IDs for half pay --
	-------------------------------------------
	set @sql =
		'
		insert tax_statement_idlist(dataset_id, id)
		select '
		+
		convert(varchar, @taxStatementDatasetID_HalfPayBill)
		+
		', tsil.id
		from tax_statement_idlist as tsil with(nolock)
		where tsil.dataset_id in ('
		+
		convert(varchar, @taxStatementDatasetID_BillIDLevy)
		+
		','
		+
		convert(varchar, @taxStatementDatasetID_BillIDAssessment)
		+
		')
		and not exists (
			select *
			from tax_statement_idlist as tsilfullpay with(nolock)
			where tsilfullpay.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FullPayBill)
		+
		'
			and tsilfullpay.id = tsil.id
		)
		order by tsil.id asc
		'

	exec (@sql)




	----------------------------------------
	-- Build list of fee IDs for full pay --
	----------------------------------------
	set @sql =
		'
		insert tax_statement_idlist(dataset_id, id)
		select distinct '
		+
		convert(varchar, @taxStatementDatasetID_FullPayFee)
		+
		', tsil.id
		from tax_statement_idlist as tsil with(nolock)
		join fee as f with(nolock) on
			f.fee_id = tsil.id
		join fee_type as ft with(nolock) on
			ft.fee_type_cd = f.fee_type_cd
		join fee_property_vw as fpv with(nolock) on
			fpv.fee_id = f.fee_id
		join (
			select distinct dues.prop_id, total_base_due = sum(base_due)
			from (
				select b.prop_id, base_due = isnull(b.current_amount_due, 0)
				from tax_statement_idlist as tsilb with(nolock)
				join bill as b with(nolock) on b.bill_id = tsilb.id
				where tsilb.dataset_id in ('
		+
		convert(varchar, @taxStatementDatasetID_BillIDLevy)
		+
		','
		+
		convert(varchar, @taxStatementDatasetID_BillIDAssessment)
		+
		')
				union all
				select fpv.prop_id, base_due = isnull(f.current_amount_due, 0)
				from tax_statement_idlist as tsilf with(nolock)
				join fee as f with(nolock) on f.fee_id = tsilf.id
				join fee_property_vw as fpv with(nolock) on fpv.fee_id = f.fee_id
				where tsilf.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FeeID)
		+
		'
			) as dues
			group by dues.prop_id
		) as fullpay on
			fullpay.prop_id = fpv.prop_id
		left join bill_fee_code bfc with (nolock)
			on bfc.bill_fee_cd = f.code
		'
		+
		@suppJoinFee
		+
		'
		where tsil.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FeeID)
		+
		'
		and (
				(total_base_due < 50.00'
		+
		case when @suppJoinFee <> '' then ' or st.supp_attribute in (5,6)' else '' end
		+
		')
				or ft.allow_half_pay = 0
				or isnull(bfc.force_full_pay, 0) = 1
		)
		order by tsil.id asc
		'

	exec (@sql)



	------------------------------------------
	-- Build a list of fee IDs for half pay --
	------------------------------------------
	set @sql =
		'
		insert tax_statement_idlist(dataset_id, id)
		select '
		+
		convert(varchar, @taxStatementDatasetID_HalfPayFee)
		+
		', tsil.id
		from tax_statement_idlist as tsil with(nolock)
		where tsil.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FeeID)
		+
		'
		and not exists (
			select *
			from tax_statement_idlist as tsilfullpay with(nolock)
			where tsilfullpay.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FullPayFee)
		+
		'
			and tsilfullpay.id = tsil.id
		)
		order by tsil.id asc
		'

	exec (@sql)



	--------------------------------
	-- Set pay status code - fees --
	--------------------------------
	set @sql =
		'
			update f
			set f.payment_status_type_cd = case when tsilfullpay.id is not null then ''FULL'' else ''HALF'' end
			from fee as f
			left outer join tax_statement_idlist as tsilfullpay with(nolock) on
				tsilfullpay.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_FullPayFee)
		+
		' and tsilfullpay.id = f.fee_id
			left outer join tax_statement_idlist as tsilhalfpay with(nolock) on
				tsilhalfpay.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_HalfPayFee)
		+
		' and tsilhalfpay.id = f.fee_id
		'

	exec (@sql)
	


	--------------------------------------
	-- Set full pay status code - bills --
	--------------------------------------
	set @sql =
		'
		update b
		set b.payment_status_type_cd = ''FULL''
		from bill as b
		join tax_statement_idlist as tsil with(nolock) on
			tsil.dataset_id = '
		+
		convert (varchar, @taxStatementDatasetID_FullPayBill)
		+
		' and tsil.id = b.bill_id
		'

	exec (@sql)



	--------------------------------------
	-- Set half-pay status code - bills --
	--------------------------------------
	set @sql =
		'
		update b
		set b.payment_status_type_cd = ''HALF''
		from bill as b
		join tax_statement_idlist as tsil with(nolock) on
			tsil.dataset_id = '
		+
		convert(varchar, @taxStatementDatasetID_HalfPayBill)
		+
		' and tsil.id = b.bill_id
		'

	exec (@sql)


	-- end of procedure update log
	set @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
   
  
	-----------------------------------
	-- return the values of interest --
	-----------------------------------
	select	@taxStatementDatasetID_FullPayBill as taxStatementDatasetID_FullPayBill,
			@taxStatementDatasetID_HalfPayBill as taxStatementDatasetID_HalfPayBill,
			@taxStatementDatasetID_FullPayFee as taxStatementDatasetID_FullPayFee,
			@taxStatementDatasetID_HalfPayFee as taxStatementDatasetID_HalfPayFee

GO

