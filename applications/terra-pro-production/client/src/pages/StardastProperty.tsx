import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function StardustProperty() {
  // Hardcoded property data for 406 Stardust Ct
  const property = {
    address: "406 Stardust Ct",
    city: "Grandview",
    state: "WA",
    zipCode: "98930",
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2432,
    lotSize: 0.25,
    yearBuilt: 2006,
    lastSold: "2020-06-15",
    lastSoldPrice: 325000,
    estimatedValue: 402500,
    features: ["Attached Garage", "Central Air", "Patio", "Fireplace", "Hardwood Floors"],
    description:
      "Beautiful single-family home in the desirable Grandview Heights neighborhood. This 4-bedroom, 2.5-bathroom home offers 2,432 square feet of living space on a quarter-acre lot. Built in 2006, it features an open floor plan, hardwood floors throughout the main level, and a spacious kitchen with granite countertops and stainless steel appliances.",
  };

  return (
    <div className="container mx-auto px-4 py-8"><>

      <h1 className="text-3xl font-bold mb-6">
        {property.address}, {property.city}, {property.state} {property.zipCode}
      </h1>

      <div
</> className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Property Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg mb-4"><>

                <div className="text-3xl font-bold text-green-600">
                  ${property.estimatedValue.toLocaleString()}
                </div>
                <div
</> className="text-sm text-gray-600">Estimated Market Value</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div><>

                  <div className="text-sm text-gray-500">Property Type</div>
                  <div
</> className="font-medium">{property.propertyType}</div>
                </div>
                <div><>

                  <div className="text-sm text-gray-500">Year Built</div>
                  <div
</> className="font-medium">{property.yearBuilt}</div>
                </div>
                <div><>

                  <div className="text-sm text-gray-500">Last Sold</div>
                  <div
</> className="font-medium">${property.lastSoldPrice.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(property.lastSold).toLocaleDateString()}
                  </div>
                </div>
                <div><>

                  <div className="text-sm text-gray-500">Bedrooms</div>
                  <div
</> className="font-medium">{property.bedrooms}</div>
                </div>
                <div><>

                  <div className="text-sm text-gray-500">Bathrooms</div>
                  <div
</> className="font-medium">{property.bathrooms}</div>
                </div>
                <div><>

                  <div className="text-sm text-gray-500">Square Feet</div>
                  <div
</> className="font-medium">{property.squareFeet.toLocaleString()}</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div><>

                <h3 className="font-semibold mb-2">Description</h3>
                <p
</> className="text-gray-700">{property.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div><>

                  <h3 className="font-semibold mb-2">Property Value Trends</h3>
                  <div
</> className="h-40 bg-gray-100 rounded flex items-center justify-center">
                    [Value Trend Chart]
                  </div>
                </div>

                <div><>

                  <h3 className="font-semibold mb-2">Local Market Conditions</h3>
                  <p
</> className="text-gray-700">
                    The Grandview real estate market has shown steady appreciation over the past 12
                    months, with median home values increasing 8.3%. This property's estimated value
                    of $402,500 represents a 23.8% increase from its last sale price in 2020.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Property Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {property.features.map((feature /* , index */) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Comparable Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-lg"><>

                  <div className="font-semibold">412 Moonbeam Dr</div>
                  <div
</> className="text-sm text-gray-600">Sold: $410,000 (2 months ago)</div>
                  <div className="text-sm">4 bed, 2.5 bath, 2,510 sqft</div>
                </div>

                <div className="p-3 border rounded-lg"><>

                  <div className="font-semibold">315 Skyview Ln</div>
                  <div
</> className="text-sm text-gray-600">Sold: $395,000 (4 months ago)</div>
                  <div className="text-sm">3 bed, 2.5 bath, 2,350 sqft</div>
                </div>

                <div className="p-3 border rounded-lg"><>

                  <div className="font-semibold">508 Galaxy Ave</div>
                  <div
</> className="text-sm text-gray-600">Sold: $425,000 (1 month ago)</div>
                  <div className="text-sm">4 bed, 3 bath, 2,600 sqft</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
