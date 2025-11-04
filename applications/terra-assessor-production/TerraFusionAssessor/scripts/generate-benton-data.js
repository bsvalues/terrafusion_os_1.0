import fs from "fs"
import path from "path"

// --- Configuration ---
const NUM_PROPERTIES = 10000
const OUTPUT_SQL_FILE = path.join(process.cwd(), "scripts", "seed-benton-county.sql")
const OUTPUT_JSON_FILE = path.join(process.cwd(), "public", "benton-county-data.json")

// --- Helper Functions & Data ---
const STREET_NAMES = ["Vineyard", "River", "Desert", "Columbia", "Gage", "Badger", "Edison", "Keene", "Dallas", "Canal"]
const STREET_TYPES = ["Rd", "Dr", "Blvd", "St", "Ave", "Ln", "Ct", "Way"]
const CITIES = {
  Kennewick: { lat: 46.2112, lng: -119.1372, zip: "99336" },
  Richland: { lat: 46.2857, lng: -119.284, zip: "99352" },
  Pasco: { lat: 46.2396, lng: -119.1006, zip: "99301" },
  Prosser: { lat: 46.2043, lng: -119.7695, zip: "99350" },
  "Benton City": { lat: 46.2637, lng: -119.4853, zip: "99320" },
}
const OWNER_FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda"]
const OWNER_LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "LLC", "Inc"]
const PROPERTY_TYPES = ["Residential", "Commercial", "Agricultural", "Industrial", "Vacant Land"]
const SCHOOL_DISTRICTS = [
  "Kennewick School District",
  "Richland School District",
  "Pasco School District",
  "Prosser School District",
]

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomFloat = (min, max, decimals) => Number.parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

// --- Main Generation Logic ---
function generateProperty(index) {
  const cityKeys = Object.keys(CITIES)
  const city = CITIES[getRandom(cityKeys)]
  const propertyType = getRandom(PROPERTY_TYPES)

  const yearBuilt = getRandomInt(1950, 2024)
  const sqft = propertyType === "Residential" ? getRandomInt(1000, 5000) : getRandomInt(5000, 100000)
  const lotSize = propertyType === "Agricultural" ? getRandomFloat(10, 200, 2) : getRandomFloat(0.1, 5, 2)
  const improvementValue = (2024 - yearBuilt) * 100 + sqft * getRandomInt(80, 200)
  const landValue = lotSize * getRandomInt(50000, 200000)

  return {
    parcel_number: `3623${getRandomInt(1000, 9999)}${String(index).padStart(4, "0")}`,
    address: `${getRandomInt(100, 9999)} ${getRandom(STREET_NAMES)} ${getRandom(STREET_TYPES)}, ${Object.keys(CITIES).find((key) => CITIES[key] === city)}, WA ${city.zip}`,
    owner_name: `${getRandom(OWNER_FIRST_NAMES)} ${getRandom(OWNER_LAST_NAMES)}`,
    property_type: propertyType,
    assessed_value: landValue + improvementValue,
    land_value: landValue,
    improvement_value: improvementValue,
    tax_year: 2024,
    lot_size_acres: lotSize,
    year_built: yearBuilt,
    bedrooms: propertyType === "Residential" ? getRandomInt(2, 6) : 0,
    bathrooms: propertyType === "Residential" ? getRandomFloat(1, 4, 1) : 0,
    sqft: sqft,
    zoning: `${propertyType.charAt(0)}-${getRandomInt(1, 3)}`,
    school_district: getRandom(SCHOOL_DISTRICTS),
    latitude: getRandomFloat(city.lat - 0.1, city.lat + 0.1, 6),
    longitude: getRandomFloat(city.lng - 0.1, city.lng + 0.1, 6),
  }
}

console.log(`Generating ${NUM_PROPERTIES} properties...`)
const properties = []
for (let i = 0; i < NUM_PROPERTIES; i++) {
  properties.push(generateProperty(i))
}
console.log("Generation complete.")

// --- SQL Output ---
console.log(`Writing SQL to ${OUTPUT_SQL_FILE}...`)
let sqlContent = `
-- Seed data for benton_county_properties
-- Generated on ${new Date().toISOString()}

-- Clear existing data
TRUNCATE TABLE benton_county_properties RESTART IDENTITY;

-- Insert new data
INSERT INTO benton_county_properties (parcel_number, address, owner_name, property_type, assessed_value, land_value, improvement_value, tax_year, lot_size_acres, year_built, bedrooms, bathrooms, sqft, zoning, school_district, latitude, longitude) VALUES
`
const valueStrings = properties.map(
  (p) =>
    `('${p.parcel_number}', '${p.address.replace(/'/g, "''")}', '${p.owner_name.replace(/'/g, "''")}', '${p.property_type}', ${p.assessed_value}, ${p.land_value}, ${p.improvement_value}, ${p.tax_year}, ${p.lot_size_acres}, ${p.year_built}, ${p.bedrooms}, ${p.bathrooms}, ${p.sqft}, '${p.zoning}', '${p.school_district}', ${p.latitude}, ${p.longitude})`,
)
sqlContent += valueStrings.join(",\n") + ";\n"
fs.writeFileSync(OUTPUT_SQL_FILE, sqlContent)
console.log("SQL file written successfully.")

// --- JSON Output for Next.js environment ---
console.log(`Writing JSON to ${OUTPUT_JSON_FILE}...`)
fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(properties, null, 2))
console.log("JSON file written successfully.")

console.log("\nData generation process finished.")
