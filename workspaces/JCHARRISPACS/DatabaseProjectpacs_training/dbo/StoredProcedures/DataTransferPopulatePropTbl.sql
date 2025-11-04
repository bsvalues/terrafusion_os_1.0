-- exec DataTransferPopulatePropTbl 'A', 2004, 0, 0, '<ALL>', '', 123,124
   /*  RonaldEspejo 3/30/2006
    *  DataTransferPopulatePropTbl
    *  @input_export_mode_chr: 'A'  for As of Supplement #
    *                          'I'  for Individual Supplement #
    *                          'G'  for Supplement Group 
    *  Depending on the mode, some parameters are ignored
    *  @input_export_mode_chr and @input_entities must always valid
    *
    *  'A' Valid params, @input_year, @input_sup_num 
    *  'I' Valid params, @input_year, @input_sup_num 
    *  'G' Valid params, @input_sup_group_id, @input_sup_group_years, 
    *  @input_prop_dataset_id : The unique identifier on the ##data_transfr_props table for this run
    *  @input_ent_dataset_id  : The unique identified on the ##data_transfr_entities table for this run
    */
CREATE PROCEDURE DataTransferPopulatePropTbl
     @input_export_mode_chr     char(1), 
     @input_year                numeric(4),
     @input_sup_num             int,
     @input_sup_group_id        int,
     @input_entities            varchar(500),
     @input_sup_group_years     varchar(500),
     @input_prop_dataset_id     bigint,
     @input_ent_dataset_id      bigint
AS

    declare @dyn_sql varchar(500)
 
   /*
    *  Store all the properties that satisfy the selection criteria
    *  into the global temporary table : ##data_transfr_props.
    *  Do a safety startup & cleanup
    */
    IF NOT EXISTS (select name from tempdb.dbo.sysobjects where name = '##data_transfr_props')
        exec CreateDataTransferTempTables

    delete from ##data_transfr_props where dataset_id = @input_prop_dataset_id

   /*
    *  All the entities selected will be entered into :##data_transfr_entities
    *  Do a safety cleanup 
    */
    DELETE FROM  ##data_transfr_entities where dataset_id = @input_ent_dataset_id 
   /*
    * All supplements selected will be entered into this table
    */
    create table #temp_sup
    (
        sup_num int,
        sup_tax_yr numeric (4),
        group_id int
    )
   /*
    * SUPPLEMENT. Insert all the supplement-year pairs we are intersted on into the
    *             temp table. Each selection depends on the export mode.
    */
    IF (@input_export_mode_chr='A')
    BEGIN
       /*
        *  As Of Supplement - We want all the previous supplements including the 
        *                     given one for the given year
        */  
        INSERT INTO #temp_sup(sup_num, sup_tax_yr, group_id) 
               SELECT sup_num, sup_tax_yr, sup_group_id 
               FROM   supplement 
               WHERE  sup_num <= @input_sup_num
               AND    sup_tax_yr = @input_year
        
    END
    ELSE IF(@input_export_mode_chr='I')
    BEGIN
       /*
        * Individual Supplement - Just insert the parameters into the table
        */
        INSERT INTO #temp_sup (sup_num, sup_tax_yr) SELECT @input_sup_num, @input_year

    END
    ELSE IF(@input_export_mode_chr='G')
    BEGIN
       /*
        * Supplement Group - if we are exporting using a group code, we have x number of 
        * sup_num-year pairs, the input is a group_id and a set of years. We need to make this
        * a dynamic query to allow the '<ALL>' selection.
        */ 
        SET @dyn_sql = 'INSERT INTO #temp_sup(sup_num, sup_tax_yr, group_id) '
        SET @dyn_sql = @dyn_sql + ' SELECT sup_num, sup_tax_yr, sup_group_id '
        SET @dyn_sql = @dyn_sql + ' FROM   supplement '
        SET @dyn_sql = @dyn_sql + ' WHERE  sup_group_id = ' + @input_sup_group_id

        IF (@input_sup_group_years<>'<ALL>')
        BEGIN
            SET @dyn_sql = @dyn_sql + ' AND    sup_tax_yr   IN( @input_sup_group_years )  '
        END
        
        exec (@dyn_sql)
       /* Clean up */
        set @dyn_sql = '' 
    END 
   /*
    * ENTITIES.  
    */
    SET @dyn_sql = 'INSERT INTO ##data_transfr_entities (entity_id, entity_cd, dataset_id) '
    SET @dyn_sql = @dyn_sql + ' SELECT entity_id , entity_cd, ' + CAST(@input_ent_dataset_id AS varchar(25) ) + '  FROM entity '
    IF (@input_entities<>'<ALL>')
    BEGIN
        SET @dyn_sql = @dyn_sql + 'WHERE entity_cd in ( ' + @input_entities + ' ) '
    END
    PRINT 'Entities Query:' + @dyn_sql
    exec (@dyn_sql)
    /* Clean up */
    set @dyn_sql = ''

   /*
    * PROPERTIES. Insert the properties based on the selections 
    *             Skip reference properties.
    */ 
    INSERT INTO ##data_transfr_props (prop_id, prop_val_yr, sup_num, dataset_id) 
    SELECT pv.prop_id, pv.prop_val_yr, MAX(pv.sup_num) AS sup_num,  @input_prop_dataset_id
    FROM   property p WITH(NOLOCK) 
    INNER JOIN property_val pv  WITH(NOLOCK) ON
               pv.prop_id = p.prop_id 
    INNER JOIN entity_prop_assoc epa with(nolock) on
               epa.prop_id = pv.prop_id
    AND        epa.sup_num = pv.sup_num 
    AND        epa.tax_yr  = pv.prop_val_yr
    AND        epa.entity_id in (select entity_id from ##data_transfr_entities 
    where dataset_id = @input_ent_dataset_id)
    INNER JOIN #temp_sup ts with(nolock) ON 
               pv.prop_val_yr = ts.sup_tax_yr 
    AND        pv.sup_num = ts.sup_num
    WHERE  
    ( (p.reference_flag <> 'T') OR (p.reference_flag IS NULL))    
    GROUP BY pv.prop_id, pv.prop_val_yr 
    
    
-- *******************************************************************
-- *DEBUG                                                            *       
-- *select * from ##data_transfr_props                               *       
-- *SELECT '#temp_sup',* FROM #temp_sup                              *       
-- *SELECT '##data_transfr_entities',* FROM ##data_transfr_entities  *       
-- *SELECT '#temp_prop_list',* FROM #temp_prop_list                  *       
-- *******************************************************************

GO

