

CREATE procedure spCURR_PROP_OWNER_W_MULT_OV65_HS 	
		@lSPIDD int

as
 --------------------------------------------------------------------------------------------
if object_id('tempdb..#SQLSELECTION') is not null drop table #SQLSELECTION
if object_id('tempdb..#WITHEXEMPTIONS') is not null drop table #WITHEXEMPTIONS
if object_id('tempdb..#OWNERSMULTIPROPS') is not null drop table #OWNERSMULTIPROPS
if object_id('tempdb..#ResultsTable') is not null drop table #ResultsTable



declare @appr_yr as int
select @appr_yr = appr_yr from pacs_system
SELECT DISTINCT owner_id, file_as_name,acct_acct_id, prop_type_cd, owner_prop_id,geo_id, legal_desc, sup_num 
	INTO #SQLSELECTION FROM CURR_PROPERTY_OWNER_VW  WHERE prop_inactive_dt IS NULL AND owner_tax_yr  = @appr_yr
--------------------------------------------------------------------------------------------------------------------
select * INTO #OWNERSMULTIPROPS from #SQLSELECTION where owner_id in (select DISTINCT owner_id FROM #SQLSELECTION  
	 GROUP BY owner_id  HAVING  COUNT(owner_id)>1 )
--------------------------------------------------------------------------------------------------------------------
--free some resources
if object_id('tempdb..#SQLSELECTION') is not null drop table #SQLSELECTION
----------------------------------------------------------------------------------
--create a temporary table
select owner_id, owner_prop_id, sup_num, 'NO EXCEPTIONS YET FOR NOW' as exmpt_type_cd INTO #ResultsTable From #OWNERSMULTIPROPS where 1=2 
----------------------------------------------------------------------------------
DECLARE @owner_id as int
DECLARE @owner_prop_id as int
DECLARE @sup_num as int
DECLARE CURSORONE CURSOR FOR SELECT owner_id, owner_prop_id, sup_num FROM #OWNERSMULTIPROPS
OPEN CURSORONE
FETCH NEXT FROM CURSORONE INTO @owner_id, @owner_prop_id, @sup_num
while @@FETCH_STATUS = 0
BEGIN
	--get the exemptions for this property
	declare @prop_exemp_str as varchar(10)
	declare @strDumb as varchar(10)
	SELECT @prop_exemp_str = ''
	DECLARE EXEMPCURSOR  CURSOR FOR SELECT exmpt_type_cd FROM prop_exemption_vw WHERE exmpt_tax_yr = @appr_yr AND prop_id = @owner_prop_id AND sup_num = @sup_num and owner_id =@owner_id AND exmpt_type_cd in ( 'HS','OV65','OV65-S','OV65S') 
	OPEN EXEMPCURSOR 
	FETCH NEXT FROM EXEMPCURSOR into @strDumb
	WHILE @@FETCH_STATUS = 0 
	BEGIN
		if LEN(@prop_exemp_str)>0 
		begin
			select @prop_exemp_str = @prop_exemp_str +','
		end
		select @prop_exemp_str = @prop_exemp_str + RTRIM(@strDumb)
		FETCH NEXT FROM EXEMPCURSOR into @strDumb
	END
	CLOSE EXEMPCURSOR
	DEALLOCATE EXEMPCURSOR

	--
	if LEN(@prop_exemp_str)>0 
	BEGIN
	   INSERT INTO #ResultsTable ( owner_id, owner_prop_id, sup_num ,exmpt_type_cd ) VALUES ( @owner_id, @owner_prop_id, @sup_num, RTRIM(@prop_exemp_str) )
	END
	--
	FETCH NEXT FROM CURSORONE INTO @owner_id, @owner_prop_id, @sup_num
END--while
CLOSE CURSORONE
DEALLOCATE CURSORONE 

SELECT * INTO #FINALBASE FROM #ResultsTable where owner_id in (select owner_id   FROm #ResultsTable GROUP BY owner_id  HAVING count(owner_id)>1 )
--------------------------------------------------------------------------------------------------------------------
--free some resources
if object_id('tempdb..#ResultsTable') is not null drop table #ResultsTable
--------------------------------------------------------------------------------------------------------------------
--insert the results into the temp table ##TT_CURR_PROP_OWNER_W_MULT_OV65_HS
if object_id('tempdb..##TT_CURR_PROP_OWNER_W_MULT_OV65_HS') is not null
BEGIN
	DELETE FROM ##TT_CURR_PROP_OWNER_W_MULT_OV65_HS where SPID = @lSPIDD
	INSERT INTO ##TT_CURR_PROP_OWNER_W_MULT_OV65_HS (owner_id, file_as_name, acct_acct_id,prop_type_cd, owner_prop_id, geo_id, legal_desc, sup_num, exmpt_type_cd, spid)
		select OPP.*, EX.exmpt_type_cd , @lSPIDD as spid FROM #OWNERSMULTIPROPS AS OPP INNER JOIN #FINALBASE as EX ON 
		 OPP.owner_id = EX.owner_id AND OPP.owner_prop_id = EX.owner_prop_id AND OPP.sup_num = EX.sup_num 
		 ORDER BY file_as_name, OPP.owner_id
END
ELSE
BEGIN
	select OPP.*, EX.exmpt_type_cd, @lSPIDD as spid INTO ##TT_CURR_PROP_OWNER_W_MULT_OV65_HS FROM #OWNERSMULTIPROPS AS OPP INNER JOIN #FINALBASE as EX ON OPP.owner_id = EX.owner_id AND OPP.owner_prop_id = EX.owner_prop_id AND OPP.sup_num = EX.sup_num ORDER BY file_as_name, OPP.owner_id
END
--------------------------------------------------------------------------------------------------------------------
--free some resources
if object_id('tempdb..#OWNERSMULTIPROPS') is not null drop table #OWNERSMULTIPROPS
if object_id('tempdb..#FINALBASE') is not null drop table #FINALBASE
-------------------------------------------------------------------------------------------------------------------- 

GO

