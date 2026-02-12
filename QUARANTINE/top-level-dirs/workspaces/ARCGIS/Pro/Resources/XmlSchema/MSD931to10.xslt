<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:typens="http://www.esri.com/schemas/ArcGIS/10.0">
  
  <xsl:param name="KeyValue" select="//VariableFieldMap/PropertyArray/PropertySetProperty/Key/text()"></xsl:param>
  <xsl:param name="RTypeZ" select="//Symbolizer/RotationType/text()"></xsl:param>
  <xsl:param name="FieldorExpression" select="//VariableFieldMap/PropertyArray/PropertySetProperty/Value[@xsi:type='xs:string']/text()"></xsl:param>
  <xsl:param name="Start">[</xsl:param>
  <xsl:param name="End">]</xsl:param>
  <xsl:param name="Joined" select="concat($Start,$FieldorExpression,$End)"></xsl:param>
    
  <xsl:output method="xml" version="1.0" indent="no" omit-xml-declaration="yes"/>
  
  <!-- XSLT to tranform 9.3.1 msd to 10.0 msd -->
  <!-- General Copy Idiom Template that copies everything -->
  <xsl:template match='node() | @*'>
	  <xsl:copy> 
		<xsl:apply-templates select='node() | @*' />
    </xsl:copy>    
  </xsl:template>

  <!--Remove LineDashEnding from CIMLineSymbol--> 
 <xsl:template match="Symbol[@xsi:type='typens:CIMLineSymbol']//LineDashEnding | //LineDashEnding/node()">
	 <xsl:apply-templates/>
 </xsl:template>
  
  <!--Remove OutlineDashEnding from CIMPolygonSymbol--> 
  <xsl:template match="Symbol[@xsi:type='typens:CIMPolygonSymbol']//OutlineDashEnding | //OutlineDashEnding/node()">
	  <xsl:apply-templates/>
 </xsl:template>

  <!--Add PrimitiveName to CIMFilledStroke and CIMHashStroke--> 
	 <xsl:template match= "ICIMSymbolLayer[@xsi:type='typens:CIMFilledStroke'] 
	  | ICIMSymbolLayer[@xsi:type='typens:CIMHashStroke'] ">
		<xsl:copy>
		  <xsl:apply-templates select="node() | @*"/>
			  <xsl:if test="not(PrimitiveName)">
				<xsl:element name="PrimitiveName"></xsl:element>
			  </xsl:if>
	   </xsl:copy>
  </xsl:template>

 <!--Add PrimitiveName to CIMSolidPattern, CIMHatchPattern, CIMGradientPattern, CIMMarkerPattern, and CIMTiledPattern-->   
 <xsl:template match= "Pattern[@xsi:type='typens:CIMSolidPattern'] |
    ICIMSymbolLayer[@xsi:type='typens:CIMHatchPattern'] | 
    ICIMSymbolLayer[@xsi:type='typens:CIMGradientPattern'] |
    ICIMSymbolLayer[@xsi:type='typens:CIMMarkerPattern'] |
    ICIMSymbolLayer[@xsi:type='typens:CIMTiledPattern']">
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
      <xsl:if test="not(PrimitiveName)">
            <xsl:element name="PrimitiveName"></xsl:element>
      </xsl:if>
   </xsl:copy>
  </xsl:template>
  
   <!--Add PrimitiveName to CIMVectorMarker--> 
   <xsl:template match= "ICIMSymbolLayer[@xsi:type='typens:CIMVectorMarker'] ">
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
      <xsl:if test="not(PrimitiveName)">
            <xsl:element name="PrimitiveName"></xsl:element>
      </xsl:if>
   </xsl:copy>
  </xsl:template>
  
   <!--Rename CIMPointSymbolPlacementAlongLine to CIMPointSymbolPlacementAlongLineSameSize--> 
  <xsl:template match="PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementAlongLine']/@*">  
	  <xsl:attribute name="xsi:type">
		  <xsl:text>typens:CIMPointSymbolPlacementAlongLineSameSize</xsl:text>  
	  </xsl:attribute> 
  </xsl:template>
  
   <!--Add CustomEndingOffset, Endings, PrimitiveName to CIMPointSymbolPlacementAlongLine--> 
  <xsl:template match= "PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementAlongLine'] ">
    <xsl:copy>
		<xsl:apply-templates select="node() | @*"/>
		<xsl:if test="not(CustomEndingOffset)">
			<xsl:element name="CustomEndingOffset">0</xsl:element>
	    </xsl:if>
		<xsl:if test="not(Endings)">
			<xsl:element name="Endings">NoConstraint</xsl:element>
		</xsl:if>
		<xsl:if test="not(PrimitiveName)">
			<xsl:element name="PrimitiveName"></xsl:element>
		</xsl:if>     
   </xsl:copy>
 </xsl:template> 

   <!-- This applies only to non-reps cases -->
 <xsl:template match= "PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementAlongLine']/ControlPointPlacement/text()">
  <xsl:text>NoConstraint</xsl:text>  
  </xsl:template>
  
   <!--Rename CIMPointSymbolPlacementAlongLine, CIMPointSymbolPlacmentDecorations FollowLine property to AngleToLine--> 
  <xsl:template match= "PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementAlongLine']/FollowLine
  | PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementDecorations']/FollowLine">
	<AngleToLine>
		<xsl:apply-templates/>
	</AngleToLine>
  </xsl:template>  
  
   <!--Rename CIMPointSymbolPlacementAlong Position property to OffsetAlongLine--> 
  <xsl:template match= "PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementAlongLine']/Position">
	  <OffsetAlongLine>
		  <xsl:apply-templates/>
	  </OffsetAlongLine>
  </xsl:template>
  
   <!--Add PrimitiveName, EndMarkersAdjustment, DecorateSybPartsOfMultiPartGeom to PointSymbolPlacementDecorations--> 
  <xsl:template match= "PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementDecorations'] ">
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
      <xsl:if test="not(PrimitiveName)">
            <xsl:element name="PrimitiveName"></xsl:element>
      </xsl:if>
      <xsl:if test="not(EndMarkersAdjustment)">
            <xsl:element name="EndMarkersAdjustment">Automatic</xsl:element>
      </xsl:if>
      <xsl:if test="not(DecorateSubPartsOfMultiPartGeom)">
            <xsl:element name="DecorateSubPartsOfMultiPartGeom">true</xsl:element>
      </xsl:if>    
    </xsl:copy>
  </xsl:template> 
  
   <!--Remove OffsetMarkersAtLineEnds from CIMPointSymbolPlacementDecorations--> 
  <xsl:template match= "PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementDecorations']/OffsetMarkersAtLineEnds
   | PointSymbolPlacementEffect[@xsi:type='typens:CIMPointSymbolPlacementDecorations']/OffsetMarkersAtLineEnds/node()"> 
	  <xsl:apply-templates/>
  </xsl:template>
    
   <!--Add ShiftOddRows to CIMFillPlacementInsidePolygon--> 
  <xsl:template match="MarkerPlacement[@xsi:type='typens:CIMFillPlacementInsidePolygon']">
     <xsl:copy>
		 <xsl:apply-templates select="node() | @*"/>
		 <xsl:if test="not(ShiftOddRows)">
			 <xsl:element name="ShiftOddRows">false</xsl:element>
		 </xsl:if>     
     </xsl:copy>
  </xsl:template> 

 <!--Add PrimitiveName, CustomEndingOffset, LineDashEnding, ControlPointEnding to CIMGeometricEffectDashes--> 
 <xsl:template match="ICIMGeometricEffect[@xsi:type='typens:CIMGeometricEffectDashes']">
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
      <xsl:if test="not(PrimitiveName)">
            <xsl:element name="PrimitiveName"></xsl:element>
      </xsl:if>
      <xsl:if test="not(CustomEndingOffset)">
            <xsl:element name="CustomEndingOffset">0</xsl:element>
      </xsl:if>
      <xsl:if test="not(LineDashEnding)">
            <xsl:element name="LineDashEnding">NoConstraint</xsl:element>
      </xsl:if>
      <xsl:if test="not(ControlPointEnding)">
            <xsl:element name="ControlPointEnding">NoConstraint</xsl:element>
      </xsl:if>
   </xsl:copy>
  </xsl:template>
  
   <!--Add PrimitiveName to CIMGeometricEffectOffset--> 
 <xsl:template match="ICIMGeometricEffect[@xsi:type='typens:CIMGeometricEffectOffset']">
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
      <xsl:if test="not(PrimitiveName)">
            <xsl:element name="PrimitiveName"></xsl:element>
      </xsl:if>
    </xsl:copy>
  </xsl:template>
  
   <!--Add PrimitiveName to CIMGeometricEffectGaps--> 
  <xsl:template match="ICIMGeometricEffect[@xsi:type='typens:CIMGeometricEffectGaps']">
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
      <xsl:if test="not(PrimitiveName)">
            <xsl:element name="PrimitiveName"></xsl:element>
      </xsl:if>
    </xsl:copy>
  </xsl:template>
    
   <!--Add PrimitiveName to CIMGeometricEffectRoundEdges--> 
  <xsl:template match="ICIMGeometricEffect[@xsi:type='typens:CIMGeometricEffectRoundEdges']">
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
      <xsl:if test="not(PrimitiveName)">
            <xsl:element name="PrimitiveName"></xsl:element>
      </xsl:if>
    </xsl:copy>
  </xsl:template>
  
  <!--Remove VariableFieldMap for Rotation and Transparency-->
  <xsl:template match="//VariableFieldMap | //VariableFieldMap/node() | //VariableFieldMap/*/text() | //PropertySetProperty | PropertySetProperty/* | PropertySetProperty/*/text()">
    <xsl:apply-templates/>    
  </xsl:template>
  
  <!--Remove RotationType-->
  <xsl:template match="//Symbolizer/RotationType | //Symbolizer/RotationType/node()">
    <xsl:apply-templates/>
  </xsl:template>

<!--Add Visual Variables for Rotation and Transparency-->
  <xsl:template match="Symbolizer">    
    <xsl:copy>
      <xsl:apply-templates select="node() | @*"/>
            <xsl:if test="$KeyValue = 'Rotation'">
              <xsl:element name="VisualVariables">
                <xsl:attribute name="xsi:type">typens:ArrayOfICIMVisualVariable</xsl:attribute>
                <xsl:element name="ICIMVisualVariable">
                  <xsl:attribute name="xsi:type">typens:CIMRotationVisualVariable</xsl:attribute>
                  <xsl:element name="VisualVariableInfoX">
                    <xsl:attribute name="xsi:type">typens:CIMVisualVariableInfo</xsl:attribute>
                    <xsl:element name="Type">None</xsl:element>
                    <xsl:element name="Expression"/>
                    <xsl:element name="RandomMin">0</xsl:element>
                    <xsl:element name="RandomMax">360</xsl:element>
                  </xsl:element><!--VisualVariableInfoX-->
                  <xsl:element name="VisualVariableInfoY">
                    <xsl:attribute name="xsi:type">typens:CIMVisualVariableInfo</xsl:attribute>
                    <xsl:element name="Type">None</xsl:element>
                    <xsl:element name="Expression"/>
                    <xsl:element name="RandomMin">0</xsl:element>
                    <xsl:element name="RandomMax">360</xsl:element>
                  </xsl:element><!--VisualVariableInfoY-->
                  <xsl:element name="VisualVariableInfoZ">
                    <xsl:attribute name="xsi:type">typens:CIMVisualVariableInfo</xsl:attribute>
                    <xsl:element name="Type">Expression</xsl:element>
                    <xsl:element name="Expression">
                    <xsl:value-of select="$Joined"/>
                    </xsl:element>
                    <xsl:element name="RandomMin">0</xsl:element>
                    <xsl:element name="RandomMax">360</xsl:element>
                  </xsl:element><!--VisualVariableInfoZ-->
                  <xsl:element name="RotationTypeZ">
                    <xsl:value-of select="$RTypeZ"/>
                  </xsl:element>
                </xsl:element> <!--ICIMVisualVariable-->
              </xsl:element> <!--VisualVariables-->
            </xsl:if> <!--If Rotation-->
            <xsl:if test="$KeyValue='Transparency'">
              <xsl:element name="VisualVariables">
                <xsl:attribute name="xsi:type">typens:ArrayOfICIMVisualVariable</xsl:attribute>
                <xsl:element name="ICIMVisualVariable">
                  <xsl:attribute name="xsi:type">typens:CIMTransparencyVisualVariable</xsl:attribute>
                  <xsl:element name="Field">
                  <xsl:value-of select="$FieldorExpression"/>
                  </xsl:element>
                </xsl:element> <!--ICIMVisualVariable-->
              </xsl:element> <!--VisualVariables-->
            </xsl:if> <!--If Tranparency-->           
      </xsl:copy>    
  </xsl:template>
  
  <xsl:template match="CIMDERasterCatalogLayer[@xsi:type='typens:CIMDERasterCatalogLayer']">
  
	<!-- Remember the 2 items that we're moving to the new ColorCorrection child element.
		 Note that b/c we are processing the parent node (CIMDERasterCatalogLayer) first 
		 we can have template matches to remove the children (ColorCorrectionReferenceOID
		 and ColorMatchingMethod, etc.) -->
	
	<xsl:variable name="ColorCorrectionReferenceOID" select="./ColorCorrectionReferenceOID/text()"/>
	<xsl:variable name="ColorMatchingMethod" select="./ColorMatchingMethod/text()"/>
	<xsl:variable name="UseColorBalancing" select="./UseColorBalancing/text()"/>
	
	<!-- xsl:copy doesn't copy attributes or children but the xsl:apply-templates line below 
		 will do that. When apply-templates runs the matches on the 2 elements we want to 
		 remove will cause those elements to be omitted from the output -->
	<xsl:copy> 
		<xsl:apply-templates select="node() | @*"/>
		<xsl:element name="ColorCorrection">
			<xsl:attribute name="xsi:type">typens:CIMRasterColorCorrection</xsl:attribute>
			<xsl:element name="PreStretchType">None</xsl:element>
			<xsl:element name="ColorBalanceMethod">
				<xsl:choose>
					<xsl:when test="$UseColorBalancing = 'true'">Dodging</xsl:when>
					<xsl:otherwise>None</xsl:otherwise>
				</xsl:choose>			
			</xsl:element>			
			<xsl:element name="ColorMatchingMethod">
				<xsl:value-of select="$ColorMatchingMethod"/>
			</xsl:element>
			<xsl:element name="NeedContrastAdjustment">false</xsl:element>
			<xsl:element name="TargetColorSurfaceType">SingleColorPoint</xsl:element>
			<!-- TargetColorRaster is not added -->
			<xsl:element name="UserDefinedReference">false</xsl:element>
			<xsl:element name="ReferenceOID">
				<xsl:value-of select="$ColorCorrectionReferenceOID"/>
			</xsl:element>
		</xsl:element>
	</xsl:copy>
  </xsl:template>
  
  <!-- Remove CIMDERasterCatalogLayer/ColorCorrectionReferenceOID -->
  <xsl:template match="CIMDERasterCatalogLayer/ColorCorrectionReferenceOID">
  </xsl:template>
  
  <!-- Remove CIMDERasterCatalogLayer/ColorMatchingMethod -->
  <xsl:template match="CIMDERasterCatalogLayer/ColorMatchingMethod">
  </xsl:template>  

  <!-- Remove CIMDERasterCatalogLayer/UseColorBalancing -->
  <xsl:template match="CIMDERasterCatalogLayer/UseColorBalancing">
  </xsl:template>  

</xsl:stylesheet>