/**
 * Terrafusion Fuzzy Search Testing Console
 * Run tests to verify fuzzy search functionality
 */

window.testFuzzySearch = function () {
  console.log('🧪 Testing Terrafusion Fuzzy Address Search...\n');

  const fuzzySearch = new FuzzyAddressSearch();
  const testCases = [
    // Exact matches
    { input: '123 Championship Way, Richland, WA 99352', description: 'Exact match test' },

    // Partial matches
    { input: 'Championship Way', description: 'Partial street name' },
    { input: '123 Champion', description: 'Partial street number + name' },

    // Typos
    { input: 'Championshp Way', description: 'Missing letter typo' },
    { input: '123 Champonship', description: 'Letter swap typo' },
    { input: 'Richlan', description: 'Incomplete city name' },

    // Alternative formats
    { input: '456 Innovation Dr', description: 'Abbreviated street type' },
    { input: 'innovation drive', description: 'Lowercase input' },
    { input: '789 tech blvd', description: 'Abbreviated + lowercase' },

    // City-only searches
    { input: 'Kennewick', description: 'City name only' },
    { input: 'Pasco', description: 'City name only' },
    { input: 'West Richland', description: 'Multi-word city' },

    // Edge cases
    { input: '12', description: 'Very short input' },
    { input: 'Main St', description: 'Common street name' },
    { input: '999 Nonexistent Rd', description: 'Non-matching address' },
  ];

  testCases.forEach((testCase /* , index */) => {
    console.log(`\n${index + 1}. ${testCase.description}`);
    console.log(`   Input: "${testCase.input}"`);

    const results = fuzzySearch.search(testCase.input, 3);

    if (results.length === 0) {
      console.log(`   Results: No matches found`);
    } else {
      console.log(`   Results: ${results.length} matches found`);
      results.forEach((result, i) => {
        console.log(`     ${i + 1}. ${result.address} (${Math.round(result.score)}% match)`);
      });
    }
  });

  console.log('\n✅ Fuzzy search testing complete!');
  console.log('\n📊 Test Summary:');
  console.log(`   • Total addresses in database: ${fuzzySearch.addressDatabase.length}`);
  console.log(`   • Test cases run: ${testCases.length}`);

  // Test performance
  const performanceTest = () => {
    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
      fuzzySearch.search('123 Champion', 5);
    }
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 1000;
    console.log(`   • Performance: ${avgTime.toFixed(3)}ms average per search (1000 iterations)`);
  };

  performanceTest();

  return {
    totalAddresses: fuzzySearch.addressDatabase.length,
    testCasesRun: testCases.length,
    success: true,
  };
};

window.showFuzzySearchDemo = function () {
  console.log('🎯 Fuzzy Search Demo - Try these searches:');
  console.log('• "123 champ" - Partial match');
  console.log('• "innovaton" - Typo in Innovation');
  console.log('• "richlan" - Incomplete city');
  console.log('• "main st" - Common street name');
  console.log('• "kennewick" - City search');
  console.log('\nTip: Type in any address input field to see fuzzy search in action!');
};

// Debug function to check if fuzzy search is working
window.debugFuzzySearch = function () {
  console.log('🔧 Terrafusion Fuzzy Search Debug Check');

  // Check if classes are loaded
  if (typeof FuzzyAddressSearch === 'undefined') {
    console.error('❌ FuzzyAddressSearch class not loaded');
    return false;
  }

  if (typeof AddressAutocomplete === 'undefined') {
    console.error('❌ AddressAutocomplete class not loaded');
    return false;
  }

  console.log('✅ Classes loaded successfully');

  // Test basic functionality
  const fuzzySearch = new FuzzyAddressSearch();
  console.log(`📊 Database loaded with ${fuzzySearch.propertyDatabase.length} properties`);

  // Test search
  const testResult = fuzzySearch.search('123 champion', 1);
  if (testResult.length > 0) {
    console.log(`✅ Search working - found: ${testResult[0].address}`);
    console.log(`🏡 Property data available:`, testResult[0].property);
  } else {
    console.log('❌ Search not working - no results found');
  }

  // Check if auto-init loaded
  if (typeof window.enableFuzzySearchOnInput === 'function') {
    console.log('✅ Auto-initialization functions available');
  } else {
    console.log('❌ Auto-initialization functions missing');
  }

  // Check enabled inputs
  const enabledInputs = document.querySelectorAll('input[data-fuzzy-search-enabled="true"]');
  console.log(`📝 ${enabledInputs.length} inputs have fuzzy search enabled`);

  enabledInputs.forEach((input, i) => {
    console.log(`   ${i + 1}. ${input.id || input.name || input.placeholder}`);
  });

  return true;
};

// Auto-run test if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Run test automatically when page loads
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      console.log('\n🔍 Terrafusion Fuzzy Search Auto-Test');
      console.log('Available commands:');
      console.log('• window.debugFuzzySearch() - Check if everything is working');
      console.log('• window.testFuzzySearch() - Run comprehensive tests');
      console.log('• window.showFuzzySearchDemo() - Show demo instructions');
      console.log('• window.getFuzzySearchStats() - Get integration statistics\n');

      // Auto-debug check
      if (typeof FuzzyAddressSearch !== 'undefined') {
        window.debugFuzzySearch();
      } else {
        console.warn(
          '⚠️ FuzzyAddressSearch not loaded yet. Try running window.debugFuzzySearch() in a few seconds.'
        );
      }
    }, 2000);
  });
}

console.log('🧪 Terrafusion Fuzzy Search Test Suite loaded');
