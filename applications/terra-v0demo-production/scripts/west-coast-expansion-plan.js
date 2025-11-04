// West Coast Expansion Plan - Phase 2
async function generateWestCoastExpansionPlan() {
  console.log("🌊 TerraFusionAssessor-1: West Coast Expansion - Phase 2")
  console.log("=" * 70)

  // Define target markets by state
  const californiaTargets = [
    {
      name: "Riverside County",
      tier: "Tier 1 - Mega",
      population: 2418185,
      parcels: 890000,
      assessedValue: 425000000000,
      contractValue: 2500000,
      annualRevenue: 650000,
      targetDate: "January 2026",
      probability: 75,
      keyFactors: [
        "Largest county by area in US",
        "Rapid population growth",
        "Aging legacy system",
        "Desert/mountain property specialization needed",
      ],
      challenges: [
        "Massive scale implementation",
        "Complex geography",
        "Multiple assessment districts",
        "High visibility project",
      ],
    },
    {
      name: "Fresno County",
      tier: "Tier 1 - Large",
      population: 1008654,
      parcels: 425000,
      assessedValue: 185000000000,
      contractValue: 1800000,
      annualRevenue: 475000,
      targetDate: "February 2026",
      probability: 80,
      keyFactors: [
        "Major agricultural county",
        "Central Valley expertise needed",
        "Current vendor contract expires 2025",
        "Budget already approved",
      ],
      challenges: [
        "Complex agricultural valuations",
        "Water rights integration",
        "Seasonal crop variations",
        "Diverse property types",
      ],
    },
    {
      name: "Kern County",
      tier: "Tier 1 - Large",
      population: 909235,
      parcels: 380000,
      assessedValue: 165000000000,
      contractValue: 1600000,
      annualRevenue: 425000,
      targetDate: "March 2026",
      probability: 85,
      keyFactors: [
        "Oil and gas properties",
        "Agricultural lands",
        "Modernization initiative approved",
        "Strong budget position",
      ],
      challenges: [
        "Energy infrastructure valuation",
        "Environmental considerations",
        "Mineral rights complexity",
        "Regulatory compliance",
      ],
    },
    {
      name: "Imperial County",
      tier: "Tier 2 - Medium",
      population: 179702,
      parcels: 85000,
      assessedValue: 45000000000,
      contractValue: 900000,
      annualRevenue: 250000,
      targetDate: "April 2026",
      probability: 90,
      keyFactors: ["Border county specialization", "Agricultural focus", "Ready to modernize", "Limited competition"],
      challenges: ["Cross-border property issues", "Limited IT resources", "Seasonal workforce", "Budget constraints"],
    },
  ]

  const oregonTargets = [
    {
      name: "Washington County",
      tier: "Tier 1 - Large",
      population: 695000,
      parcels: 285000,
      assessedValue: 195000000000,
      contractValue: 1500000,
      annualRevenue: 395000,
      targetDate: "April 2026",
      probability: 60,
      keyFactors: [
        "Tech corridor properties",
        "Nike headquarters impact",
        "High property values",
        "Contract expires 2026",
      ],
      challenges: [
        "Competitive market",
        "High expectations",
        "Complex tech property valuations",
        "Incumbent vendor entrenchment",
      ],
    },
    {
      name: "Marion County",
      tier: "Tier 2 - Medium",
      population: 384149,
      parcels: 165000,
      assessedValue: 85000000000,
      contractValue: 1100000,
      annualRevenue: 290000,
      targetDate: "June 2026",
      probability: 75,
      keyFactors: ["State capital area", "Agricultural/urban mix", "Government properties", "Modernization planned"],
      challenges: [
        "Government property complexity",
        "Historic district considerations",
        "Mixed property types",
        "Political considerations",
      ],
    },
    {
      name: "Lane County",
      tier: "Tier 2 - Medium",
      population: 382067,
      parcels: 195000,
      assessedValue: 78000000000,
      contractValue: 1000000,
      annualRevenue: 265000,
      targetDate: "July 2026",
      probability: 80,
      keyFactors: [
        "University of Oregon impact",
        "Timber properties",
        "System replacement needed",
        "Strong local support",
      ],
      challenges: [
        "Timber valuation complexity",
        "University property considerations",
        "Environmental regulations",
        "Rural/urban divide",
      ],
    },
  ]

  const nevadaTargets = [
    {
      name: "Carson City",
      tier: "Tier 3 - Small",
      population: 58639,
      parcels: 28000,
      assessedValue: 18000000000,
      contractValue: 450000,
      annualRevenue: 125000,
      targetDate: "July 2026",
      probability: 85,
      keyFactors: ["Independent city-county", "State capital", "Ready to upgrade", "Limited competition"],
      challenges: [
        "Small market size",
        "Government property complexity",
        "Historic considerations",
        "Limited resources",
      ],
    },
    {
      name: "Douglas County",
      tier: "Tier 3 - Small",
      population: 48905,
      parcels: 35000,
      assessedValue: 28000000000,
      contractValue: 500000,
      annualRevenue: 140000,
      targetDate: "August 2026",
      probability: 80,
      keyFactors: ["Lake Tahoe properties", "High-value residential", "Specialization needed", "Legacy system issues"],
      challenges: [
        "Luxury property valuations",
        "Seasonal market fluctuations",
        "Environmental restrictions",
        "Cross-state coordination",
      ],
    },
  ]

  // Calculate totals
  const allTargets = [...californiaTargets, ...oregonTargets, ...nevadaTargets]
  const totalCounties = allTargets.length
  const totalParcels = allTargets.reduce((sum, county) => sum + county.parcels, 0)
  const totalAssessedValue = allTargets.reduce((sum, county) => sum + county.assessedValue, 0)
  const totalContractValue = allTargets.reduce((sum, county) => sum + county.contractValue, 0)
  const totalAnnualRevenue = allTargets.reduce((sum, county) => sum + county.annualRevenue, 0)
  const weightedProbability = allTargets.reduce(
    (sum, county) => sum + (county.contractValue * county.probability) / 100,
    0,
  )

  console.log("🎯 West Coast Expansion Overview:")
  console.log(`   Target Counties: ${totalCounties}`)
  console.log(`   Total Parcels: ${totalParcels.toLocaleString()}`)
  console.log(`   Total Assessed Value: $${(totalAssessedValue / 1000000000).toFixed(1)}B`)
  console.log(`   Total Contract Value: $${(totalContractValue / 1000000).toFixed(1)}M`)
  console.log(`   Annual Recurring Revenue: $${(totalAnnualRevenue / 1000000).toFixed(1)}M`)
  console.log(`   Weighted Contract Probability: $${(weightedProbability / 1000000).toFixed(1)}M`)

  console.log("\n🏛️ CALIFORNIA TARGETS:")
  californiaTargets.forEach((county) => {
    console.log(`\n   ${county.name} (${county.tier})`)
    console.log(`      Population: ${county.population.toLocaleString()}`)
    console.log(`      Parcels: ${county.parcels.toLocaleString()}`)
    console.log(`      Assessed Value: $${(county.assessedValue / 1000000000).toFixed(1)}B`)
    console.log(`      Contract Value: $${(county.contractValue / 1000000).toFixed(1)}M`)
    console.log(`      Annual Revenue: $${county.annualRevenue.toLocaleString()}`)
    console.log(`      Target Date: ${county.targetDate}`)
    console.log(`      Win Probability: ${county.probability}%`)
    console.log(`      Key Success Factors:`)
    county.keyFactors.forEach((factor) => console.log(`         • ${factor}`))
    console.log(`      Implementation Challenges:`)
    county.challenges.forEach((challenge) => console.log(`         • ${challenge}`))
  })

  console.log("\n🌲 OREGON TARGETS:")
  oregonTargets.forEach((county) => {
    console.log(`\n   ${county.name} (${county.tier})`)
    console.log(`      Population: ${county.population.toLocaleString()}`)
    console.log(`      Parcels: ${county.parcels.toLocaleString()}`)
    console.log(`      Assessed Value: $${(county.assessedValue / 1000000000).toFixed(1)}B`)
    console.log(`      Contract Value: $${(county.contractValue / 1000000).toFixed(1)}M`)
    console.log(`      Annual Revenue: $${county.annualRevenue.toLocaleString()}`)
    console.log(`      Target Date: ${county.targetDate}`)
    console.log(`      Win Probability: ${county.probability}%`)
    console.log(`      Key Success Factors:`)
    county.keyFactors.forEach((factor) => console.log(`         • ${factor}`))
    console.log(`      Implementation Challenges:`)
    county.challenges.forEach((challenge) => console.log(`         • ${challenge}`))
  })

  console.log("\n🎰 NEVADA TARGETS:")
  nevadaTargets.forEach((county) => {
    console.log(`\n   ${county.name} (${county.tier})`)
    console.log(`      Population: ${county.population.toLocaleString()}`)
    console.log(`      Parcels: ${county.parcels.toLocaleString()}`)
    console.log(`      Assessed Value: $${(county.assessedValue / 1000000000).toFixed(1)}B`)
    console.log(`      Contract Value: $${(county.contractValue / 1000000).toFixed(1)}M`)
    console.log(`      Annual Revenue: $${county.annualRevenue.toLocaleString()}`)
    console.log(`      Target Date: ${county.targetDate}`)
    console.log(`      Win Probability: ${county.probability}%`)
    console.log(`      Key Success Factors:`)
    county.keyFactors.forEach((factor) => console.log(`         • ${factor}`))
    console.log(`      Implementation Challenges:`)
    county.challenges.forEach((challenge) => console.log(`         • ${challenge}`))
  })

  console.log("\n📈 MARKET STRATEGY:")
  console.log("   California Approach:")
  console.log("      • Focus on agricultural expertise from Washington success")
  console.log("      • Leverage Prop 13 compliance capabilities")
  console.log("      • Target counties with expiring vendor contracts")
  console.log("      • Emphasize cost savings and efficiency gains")

  console.log("   Oregon Approach:")
  console.log("      • Highlight timber and agricultural property expertise")
  console.log("      • Focus on Measure 5/50 compliance")
  console.log("      • Target counties seeking modernization")
  console.log("      • Leverage Pacific Northwest regional presence")

  console.log("   Nevada Approach:")
  console.log("      • Gaming and resort property specialization")
  console.log("      • Mining property valuation capabilities")
  console.log("      • Target smaller counties for quick wins")
  console.log("      • Build reference base for larger opportunities")

  console.log("\n🎯 IMPLEMENTATION TIMELINE:")
  console.log("   Q3 2025: Sales & Marketing Blitz")
  console.log("      • California market entry campaign")
  console.log("      • Oregon relationship building")
  console.log("      • Nevada opportunity development")
  console.log("   Q4 2025: Contract Negotiations")
  console.log("      • Riverside County proposal")
  console.log("      • Fresno County competitive bid")
  console.log("      • Carson City direct negotiation")
  console.log("   Q1 2026: Implementation Wave 1")
  console.log("      • Riverside County kickoff")
  console.log("      • Fresno County data migration")
  console.log("      • Kern County planning")
  console.log("   Q2-Q3 2026: Full Deployment")
  console.log("      • All counties in implementation")
  console.log("      • Parallel project management")
  console.log("      • Regional support centers")

  console.log("\n💰 FINANCIAL PROJECTIONS:")
  console.log(`   Total Addressable Market: $${(totalContractValue / 1000000).toFixed(1)}M`)
  console.log(`   Probability-Weighted Revenue: $${(weightedProbability / 1000000).toFixed(1)}M`)
  console.log(`   5-Year Revenue Potential: $${((weightedProbability + totalAnnualRevenue * 5) / 1000000).toFixed(1)}M`)
  console.log(`   Market Share Target: 15% of West Coast market`)
  console.log(`   ROI Projection: 340% over 5 years`)

  console.log("\n🏆 SUCCESS METRICS:")
  console.log("   • Win 70%+ of targeted opportunities")
  console.log("   • $8M+ in new contract value")
  console.log("   • $2M+ in annual recurring revenue")
  console.log("   • Establish West Coast market presence")
  console.log("   • Build reference base for national expansion")

  console.log("\n🚀 NEXT ACTIONS:")
  console.log("   1. Establish California sales office (Q3 2025)")
  console.log("   2. Hire West Coast sales team (3 reps)")
  console.log("   3. Develop California-specific marketing materials")
  console.log("   4. Begin Riverside County relationship building")
  console.log("   5. Attend California Assessors Association conference")

  console.log("\n✅ WEST COAST EXPANSION PLAN ACTIVATED!")
  console.log("🎯 Target: 9 West Coast counties by end of 2026")
  console.log("💰 Revenue Target: $10.5M contracts + $2.8M annual recurring")
  console.log("🌊 Market Position: Dominant West Coast assessment platform")

  return {
    californiaTargets,
    oregonTargets,
    nevadaTargets,
    totalCounties,
    totalContractValue,
    totalAnnualRevenue,
    weightedProbability,
  }
}

generateWestCoastExpansionPlan().catch(console.error)
