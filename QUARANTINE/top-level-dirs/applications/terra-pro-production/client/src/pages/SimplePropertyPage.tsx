import { useState, useEffect } from "react";

export default function SimplePropertyPage() {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-700 text-white p-6 rounded-t-lg"><>

          <h1 className="text-2xl font-bold">Terrafusion Property Analysis</h1>
          <p
</> className="text-sm mt-2">Analysis Date: May 19, 2025</p>
        </div>

        <div className="bg-white p-6 shadow-md mb-6">
          <div className="border-b pb-4 mb-6"><>

            <h2 className="text-2xl font-bold">406 Stardust Ct</h2>
            <p
</> className="text-gray-600">Grandview, WA 98930</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><>

                  <div className="text-gray-500 text-sm">Property Type</div>
                  <div
</> className="font-bold text-lg">Single Family</div>
                </div>
                <div><>

                  <div className="text-gray-500 text-sm">Bedrooms</div>
                  <div
</> className="font-bold text-lg">4</div>
                </div>
                <div><>

                  <div className="text-gray-500 text-sm">Bathrooms</div>
                  <div
</> className="font-bold text-lg">2.5</div>
                </div>
                <div><>

                  <div className="text-gray-500 text-sm">Square Feet</div>
                  <div
</> className="font-bold text-lg">1,850</div>
                </div>
                <div><>

                  <div className="text-gray-500 text-sm">Year Built</div>
                  <div
</> className="font-bold text-lg">1995</div>
                </div>
                <div><>

                  <div className="text-gray-500 text-sm">Lot Size</div>
                  <div
</> className="font-bold text-lg">0.17 acres</div>
                </div>
              </div>

              <div className="mt-6"><>

                <div className="text-gray-500 text-sm">Features</div>
                <div
</> className="flex flex-wrap gap-2 mt-2"><>

                  <span className="bg-gray-100 px-3 py-1 rounded text-sm">Garage</span>
                  <span
</> className="bg-gray-100 px-3 py-1 rounded text-sm">Fireplace</span><>

                  <span className="bg-gray-100 px-3 py-1 rounded text-sm">Patio</span>
                  <span
</> className="bg-gray-100 px-3 py-1 rounded text-sm">Fenced Yard</span>
                  <span className="bg-gray-100 px-3 py-1 rounded text-sm">Updated Kitchen</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-4 flex flex-col items-center justify-center"><>

              <div className="text-3xl text-blue-700 font-bold">$345,000</div>
              <div
</> className="text-gray-500 text-sm">Range: $330,000 - $360,000</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 shadow-md mb-6"><>

          <h2 className="text-xl text-blue-700 font-bold mb-4">Valuation Adjustments</h2>

          <div
</> className="border-b py-3 flex justify-between">
            <div><>

              <div className="font-semibold">Location</div>
              <div
</> className="text-gray-500 text-sm">Grandview, WA location premium</div>
            </div>
            <div className="font-bold text-green-600">+$15,000</div>
          </div>

          <div className="border-b py-3 flex justify-between">
            <div><>

              <div className="font-semibold">Size</div>
              <div
</> className="text-gray-500 text-sm">1,850 square feet</div>
            </div>
            <div className="font-bold text-green-600">+$10,000</div>
          </div>

          <div className="py-3 flex justify-between">
            <div><>

              <div className="font-semibold">Year Built</div>
              <div
</> className="text-gray-500 text-sm">Built in 1995</div>
            </div>
            <div className="font-bold text-red-500">-$5,000</div>
          </div>
        </div>

        <div className="bg-white p-6 shadow-md mb-6"><>

          <h2 className="text-xl text-blue-700 font-bold mb-4">Market Analysis</h2>
          <p
</> className="mb-4">
            The Grandview, WA real estate market has shown steady growth with average prices
            increasing 4.7% year-over-year. This property's location benefits from proximity to
            well-rated schools and local amenities.
          </p><>


          <h2 className="text-xl text-blue-700 font-bold mb-4 mt-6">Comparable Properties</h2>
          <p
</> className="mb-4">
            Recent sales of similar properties in Grandview range between $330,000 and $360,000,
            with an average sale price of $338,500 for comparable 4-bedroom homes. Properties with
            updated features like this one tend to sell at the higher end of the range.
          </p><>


          <h2 className="text-xl text-blue-700 font-bold mb-4 mt-6">Property Insights</h2>
          <p
</>>
            This home offers good value in the current market with its spacious layout and desirable
            features. The property has been well-maintained and has several recent upgrades that
            contribute to its above-average valuation for the neighborhood.
          </p>
        </div>
      </div>
    </div>
  );
}
