
------------------------------------------------------------------------------------------------
-- Logic to handle complex and common attributes conversion
------------------------------------------------------------------------------------------------

local function ConcatenateS57Attribute(attr1, attr2)
    if attr1 == nil then 
        return attr2
    elseif attr2 == nil then
        return attr1
    end
    return attr1..';'..attr2
end

-- Only converts the 1st instance to either INFORM, or NINFOM, and TXTDSC, or NTXTDSz
-- TODO: Will need to handle multiple instances and possibly concatenate them in the converted fields.
local function information(information)
    local instance =  information.GetFirstInstance()
    if instance == nil then
        return {}
    end
    if instance.language.GetFirstValue() == nil or instance.language.GetFirstValue() == 'eng' then
        return {
            INFORM = instance.text.GetFirstValue(),
            TXTDSC = instance.fileReference.GetFirstValue()
        }
    end

    return {
        NINFOM = instance.text.GetFirstValue(),
        NTXTDS = instance.fileReference.GetFirstValue()
    }
end

-- Only converts the 1st instance to either OBJNAM, or NOBJNM 
-- returns OBJNAM, NOBJNM, one of which is nil
local function featureName(featureName)
    local instance = featureName.GetFirstInstance()
    if instance == nil then
        return {}
    end
    if instance.language.GetFirstValue() == nil or instance.language.GetFirstValue() == 'eng' then
        return {OBJNAM = instance.name.GetFirstValue()}
    end

    return {NOBJNM = instance.name.GetFirstValue()}
end

-- Converts the 1st instance of fixedDateRange to DATSTA, and DATEND 
local function fixedDateRange(fixedDateRange)
    local instance = fixedDateRange.GetFirstInstance()
    if instance == nil then
        return {}
    end
    return {DATSTA = instance.dateStart.GetFirstValue(), DATEND = instance.dateEnd.GetFirstValue()}
end

local function periodicDateRange(periodicDateRange)
    local instance = periodicDateRange.GetFirstInstance()
    if instance == nil then
        return {}
    end
    return {PERSTA = instance.dateStart.GetFirstValue(), PEREND = instance.dateEnd.GetFirstValue()}
end

-- Converts the 1st instance of surveyDateRange to DATSTA, and DATEND 
local function surveyDateRange(surveyDateRange)
    local instance = surveyDateRange.GetFirstInstance()
    if instance == nil then
        return {}
    end
    return {SURSTA = instance.dateStart.GetFirstValue(), SUREND = instance.dateEnd.GetFirstValue()}
end

-- TODO: In 8211 its probably encoded as 1 or 2 rather than string literal 'True'/'False' in which case this directly converts ?
local function radarConspicuous(radarConspicuous)
    local conrad = radarConspicuous.GetFirstValue()
    if conrad == 'True' then
        return 1
    elseif conrad == 'False' then
        return 2
    end
    return nil
end

-- Returns VERDAT or INFORM if the verticalDatum = 44
local function verticalDatum(verticalDatum)
    if verticalDatum.GetFirstValue() == '44' then
        return {INFORM = 'Baltic Sea chart datum 2000'}
    end
    return {VERDAT = verticalDatum.GetFirstValue()}
end

local function verticalUncertainty(verticalUncertainty)
    local vuInstance = verticalUncertainty.GetFirstInstance()
    return vuInstance and vuInstance.uncertaintyFixed.GetFirstValue()
end

local function horizontalPositionUncertainty(horizontalPositionUncertainty)
    local hpuInstance = horizontalPositionUncertainty.GetFirstInstance()
    return hpuInstance and hpuInstance.uncertaintyFixed.GetFirstValue()
end

local function horizontalClearanceFixed(horizontalClearanceFixed)
    local horclr = horizontalClearanceFixed[-1] and horizontalClearanceFixed[-1].horizontalClearanceValue.GetFirstValue()
    local horacc = horizontalClearanceFixed[-1] and horizontalClearanceFixed[-1].horizontalDistanceUncertainty.GetFirstValue()
    return {HORCLR = horclr, HORACC = horacc}
end

local function verticalClearanceFixed(verticalClearanceFixed)
    local vcfInstance = verticalClearanceFixed.GetFirstInstance()
    if vcfInstance == nil then
        return {}
    end
    local verclr = vcfInstance.verticalClearanceValue.GetFirstValue()
    local veracc = verticalUncertainty(vcfInstance.verticalUncertainty)
    return {VERCLR = verclr, VERACC = veracc}
end

local function verticalClearanceClosed(verticalClearanceClosed)
    local vccInstance = verticalClearanceClosed.GetFirstInstance()
    if vccInstance == nil then
        return {}
    end
    local verccl = vccInstance.verticalClearanceValue.GetFirstValue()
    local veracc = verticalUncertainty(vccInstance.verticalUncertainty)
    return {VERCCL = verccl, VERACC = veracc}
end

local function verticalClearanceOpen(verticalClearanceOpen)
    local vercop = nil
    local veracc = nil
    local vcoInstance = verticalClearanceOpen.GetFirstInstance()
    if vcoInstance ~= nil then
        vercop = vcoInstance.verticalClearanceValue.GetFirstValue()
        veracc = verticalUncertainty(vcoInstance.verticalUncertainty)
    end
    return {VERCOP = vercop, VERACC = veracc}
end

local function maximumPermittedDraught(maximumPermittedDraught)
    local mpd = maximumPermittedDraught.GetFirstValue()
    if mpd ~= nil then
        return {INFORM = 'Maximum draught permitted = '..mpd..' metres'}
    end
end

local function topmark(topmark)
    local tmInstance = topmark.GetFirstInstance()
    if tmInstance == nil then
        return nil
    end

    local S57Lib = require('S57Lib')
    local s57Feature = S57Lib.CreateFeature('TOPMAR')
    s57Feature.COLOUR = tmInstance.colour.GetCommaSeparatedValues()
    s57Feature.TOPSHP = tmInstance.topmarkDaymarkShape.GetFirstValue()
    local info = information(tmInstance.shapeInformation)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    return s57Feature
end

-- converts multiplicityOfFeatures into attribute MLTYLT and INFORM
-- S-57 features that allow MLTYLT should use the returned MLTYLT, other S-57 features
-- can use the returned INFORM text 
local function multiplicityOfFeatures(multiplicityOfFeatures, featureName)
    local multInstance = multiplicityOfFeatures.GetFirstInstance()
    if multInstance == nil then
        return {}
    end
    
    local mltylt = nil
    if multInstance.multiplicityKnown.GetFirstValue() == 1 then -- multiplicityKnown = True
        mltylt = multInstance.numberOfFeatures.GetFirstValue()
    elseif multInstance.multiplicityKnown.GetFirstValue() == 0 then -- multiplicityKnown = False
        mltylt = '' -- multiplicity unknown
    end

    local info = nil
    if type(mltylt) == 'number' then
        info = mltylt..' '..featureName -- example set INFORM = '3 chimneys' for Landmark feature with categoryOfLandmark = 3 (Chimney)
    elseif mltylt == '' then
        info =  'more than one'
    end 

    return {MLTYLT = mltylt, INFORM = info}
end

local function orientation(orientation)
    local oInstance =  orientation.GetFirstInstance()
    if oInstance == nil then
        return nil
    end
    oInstance.orientationUncertainty.DidNotConvert = true
    return oInstance.orientationValue.GetFirstValue()
end

local function signalSequence(signalSequence, litchr)
    if not signalSequence.HasInstance() then
        return nil
    end

    local ll = {}
    local ee = {}
    for _,sigseqInst in pairs(signalSequence.Instances) do
        if sigseqInst.signalStatus.GetFirstValue() == 1 then -- 1 = lit/sound
            table.insert(ll, sigseqInst.signalDuration.GetFirstValue())
        elseif sigseqInst.signalStatus.GetFirstValue() == 2 then -- 2 = eclipsed/silent
            table.insert(ee, sigseqInst.signalDuration.GetFirstValue())
        end
    end

    local sigseqArray = {}
    for i,ll in ipairs(ll) do
        local ee = '('..ee[i]..')'
        if litchr == '8' then --occulting
            table.insert(sigseqArray, ee..'+'..ll)
        else
            table.insert(sigseqArray, ll..'+'..ee)
        end
    end

    return table.concat(sigseqArray, '+')
end

local function rhythmOfLight(rhythmOfLight)
    local rolInstance = rhythmOfLight.GetFirstInstance()
    if(rolInstance == nil) then
        return {}
    end

    local litchr = rolInstance.lightCharacteristic.GetFirstValue()
    local siggrp = rolInstance.signalGroup.GetFirstValue()
    local sigper = rolInstance.signalPeriod.GetFirstValue()
    local sigseq = signalSequence(rolInstance.signalSequence, litchr)

    return {LITCHR = litchr, SIGGRP = siggrp, SIGPER = sigper, SIGSEQ = sigseq}
end

local function speed(speed)
    return speed.GetFirstInstance() and speed.GetFirstInstance().speedMaximum.GetFirstValue()
end

local function sectorLimit(sectorLimit)
    local sectr1
    local sectr2
    local slInstance = sectorLimit.GetFirstInstance()
    if slInstance ~= nil then
        sectr1 = slInstance.sectorLimitOne.GetFirstInstance() and slInstance.sectorLimitOne.GetFirstInstance().sectorBearing.GetFirstValue()
        sectr2 = slInstance.sectorLimitTwo.GetFirstInstance() and slInstance.sectorLimitTwo.GetFirstInstance().sectorBearing.GetFirstValue()
    end
    return {SECTR1 = sectr1, SECTR2 = sectr2}
end

local function radarWaveLength(radarWaveLength)
    if not radarWaveLength.HasInstance() then
        return nil
    end

    local bands = {}
    local wavelengths = {}
    for _,inst in pairs(radarWaveLength.Instances) do
        table.insert(bands, inst.radarBand.GetFirstValue())
        table.insert(wavelengths, inst.waveLengthValue.GetFirstValue())
    end

    local vvvb = {}
    for i,vvv in ipairs(wavelengths) do
        local b = bands[i]
        table.insert(vvvb, vvv..'-'..b) 
    end

    return table.concat(vvvb, ',')
end

local function frequencyPair(frequencyPair)
    return frequencyPair.GetFirstInstance() and frequencyPair.GetFirstInstance().frequencyShoreStationTransmits.GetFirstValue()
end

local function surfaceCharacteristics(surfaceCharacteristics)
    if not surfaceCharacteristics.HasInstance() then
        return {}
    end

    local natsurArray = {}
    local natquaArray = {}

    for _,inst in pairs(surfaceCharacteristics.Instances) do
        if inst.natureOfSurface.GetFirstInstance() ~= nil then
            table.insert(natsurArray, inst.natureOfSurface.GetFirstValue())
        end
        if inst.natureOfSurfaceQualifyingTerms.GetFirstInstance() ~= nil then
            -- natqua can have upto 3 instances, delimit them with '/' ?
            -- TODO: / is used for underlying layer. Needs more clarification on how to convert the 3 instances.
            local valarr = inst.natureOfSurfaceQualifyingTerms.GetValueArray()
            table.insert(natquaArray, table.concat(valarr, '/'))
        end
    end

    local natsur
    local natqua    
    if #natsurArray > 0 then
        natsur = table.concat(natsurArray, ',')
    end
    if #natquaArray > 0 then
        natqua = table.concat(natquaArray, ',')
    end

    return {NATSUR = natsur, NATQUA = natqua}
end

local function horizontalClearanceOpen(horizontalClearanceOpen)
    local hcoInstance = horizontalClearanceOpen.GetFirstInstance()
    if hcoInstance == nil then
        return {}
    end
    local horclr = hcoInstance.horizontalClearanceValue.GetFirstValue()
    local horacc = hcoInstance.horizontalDistanceUncertainty.GetFirstValue()
    return {HORCLR = horclr, HORACC = horacc}
end

local function verticalClearanceSafe(verticalClearanceSafe)
    local vcsInstance = verticalClearanceSafe.GetFirstInstance()
    if vcsInstance == nil then
        return {}
    end
    local vercsa = vcsInstance.verticalClearanceValue.GetFirstValue()
    local veracc = verticalUncertainty(vcsInstance.verticalUncertainty)
    return {VERCSA = vercsa, VERACC = veracc}
end

local function tidalStreamPanelValues(stationName, stationNumber, tidalStreamPanelValues)
    -- TODO: implement
    if stationName.GetFirstInstance() ~= nil then
        stationName.DidNotConvert = true
    end
    if stationNumber.GetFirstInstance() ~= nil then
        stationNumber.DidNotConvert = true
    end
    if tidalStreamPanelValues.GetFirstInstance() ~= nil then
        tidalStreamPanelValues.DidNotConvert = true
    end
    return nil
end

local function valueOfLocalMagneticAnomaly(valueOfLocalMagneticAnomaly)
    -- TODO: implement
    if(valueOfLocalMagneticAnomaly.GetFirstInstance() ~= nil) then
        valueOfLocalMagneticAnomaly.DidNotConvert = true
    end

    return {VALLMA = nil, INFORM = nil}
end

local function zoneOfConfidence(zoneOfConfidence)
    local zoc = zoneOfConfidence.GetFirstInstance()
    if zoc == nil then
        return {}
    end
    local catzoc = zoc.categoryOfZoneOfConfidenceInData.GetFirstValue()

    local fdr = fixedDateRange(zoc.fixedDateRange)
    local datsta = fdr.DATSTA
    local datend = fdr.DATEND

    if(#zoneOfConfidence.Instances > 1) then
        for i = 2,#zoneOfConfidence.Instances do
            local zocAdditionalInst = zoneOfConfidence.Instances[i]
            zocAdditionalInst.DidNotConvert = true
        end
    end

    return {CATZOC = catzoc, DATEND = datend, DATSTA = datsta}
end

local function spatialAccuracy(spatialAccuracy)
    local sa = spatialAccuracy.GetFirstInstance()
    if sa == nil then
        return {}
    end
    local fdr = fixedDateRange(sa.fixedDateRange)
    local datsta = fdr.DATSTA
    local datend = fdr.DATEND
    local posacc = horizontalPositionUncertainty(sa.horizontalPositionUncertainty)
    local souacc = verticalUncertainty(sa.verticalUncertainty)
    return {POSACC = posacc, SOUACC = souacc, DATEND = datend, DATSTA = datsta}
end

local function sectorCharacteristics(sectorCharacteristics)
    local attributesArray = {}
    for _,scInstance in ipairs(sectorCharacteristics.Instances) do
        local litchr = scInstance.lightCharacteristic.GetFirstValue()
        local siggrp = scInstance.signalGroup.GetFirstValue()
        local sigper = scInstance.signalPeriod.GetFirstValue()
        local sigseq = signalSequence(scInstance.signalSequence, litchr)

        local scAttributes =
        {
            LITCHR = litchr,
            SIGGRP = siggrp,
            SIGPER = sigper,
            SIGSEQ = sigseq,
        }

        local sclsAttributesArray = {}
        for _,lsInstance in ipairs(scInstance.lightSector.Instances) do
            local colour = lsInstance.colour.GetCommaSeparatedValues()
            local catlit, orient
            local dcInstance = lsInstance.directionalCharacter.GetFirstInstance()
            if dcInstance ~= nil then
                if dcInstance.moireEffect.GetFirstValue() == 1 then
                    catlit = "16"
                end
                orient = orientation(dcInstance.orientation)
            end
            local litvis = lsInstance.lightVisibility.GetFirstValue()
            local sectr = sectorLimit(lsInstance.sectorLimit)
            local sectr1 = sectr.SECTR1
            local sectr2 = sectr.SECTR2
            local valnmr = lsInstance.valueOfNominalRange.GetFirstValue()
            local info = information(lsInstance.sectorInformation)
            local inform = info.INFORM
            local ninfom = info.NINFOM
            -- lsInstance.sectorArcExtension.DidNotConvert = true
    
            table.insert(sclsAttributesArray,
            {
                LITCHR = scAttributes.LITCHR,
                SIGGRP = scAttributes.SIGGRP,
                SIGPER = scAttributes.SIGPER,
                SIGSEQ = scAttributes.SIGSEQ,
                COLOUR = colour,
                CATLIT = catlit,
                ORIENT = orient,
                LITVIS = litvis,
                SECTR1 = sectr1,
                SECTR2 = sectr2,
                VALNMR = valnmr,
                INFORM = inform,
                NINFOM = ninfom,
            })
        end

        if #sclsAttributesArray == 0 then
            table.insert(sclsAttributesArray, scAttributes)
        end

        for _, attrs in ipairs(sclsAttributesArray) do
            table.insert(attributesArray, attrs)
        end
    end
    return attributesArray
end

local function vesselSpeedLimit(vesselSpeedLimit)
    if vesselSpeedLimit.GetFirstInstance() ~= nil then
        vesselSpeedLimit.DidNotConvert = true
    end
    return nil
end

local function measuredDistanceValue(measuredDistanceValue)
    if measuredDistanceValue.GetFirstInstance() ~= nil then
        measuredDistanceValue.DidNotConvert = true
    end
    return nil
end

local function featuresDetected(featuresDetected)
    if featuresDetected.HasInstance() then
        featuresDetected.DidNotConvert = true
    end
end

return {
    ConcatenateS57Attribute = ConcatenateS57Attribute,
    information = information,
    featureName = featureName,
    fixedDateRange = fixedDateRange,
    periodicDateRange = periodicDateRange,
    verticalUncertainty = verticalUncertainty,
    topmark = topmark,
    multiplicityOfFeatures = multiplicityOfFeatures,
    verticalClearanceFixed = verticalClearanceFixed,
    horizontalClearanceFixed = horizontalClearanceFixed,
    orientation = orientation,
    rhythmOfLight = rhythmOfLight,
    surveyDateRange = surveyDateRange,
    signalSequence = signalSequence,
    speed = speed,
    verticalClearanceOpen = verticalClearanceOpen,
    --TODO: featuresDetected = featuresDetected,
    sectorLimit = sectorLimit,
    radarWaveLength = radarWaveLength,
    frequencyPair = frequencyPair,
    shapeInformation = information,
    sectorCharacteristics = sectorCharacteristics,
    --TODO: vesselSpeedLimit = vesselSpeedLimit,
    surfaceCharacteristics = surfaceCharacteristics,
    tidalStreamPanelValues = tidalStreamPanelValues,
    horizontalClearanceOpen = horizontalClearanceOpen,
    --TODO: measuredDistanceValue = measuredDistanceValue,
    verticalClearanceSafe = verticalClearanceSafe,
    verticalClearanceClosed = verticalClearanceClosed,
    valueOfLocalMagneticAnomaly = valueOfLocalMagneticAnomaly,
    zoneOfConfidence = zoneOfConfidence,
    horizontalPositionUncertainty = horizontalPositionUncertainty,
    radarConspicuous = radarConspicuous,
    verticalDatum = verticalDatum,
    maximumPermittedDraught = maximumPermittedDraught,
    spatialAccuracy = spatialAccuracy,
}
