const fs = require('fs');

const code = fs.readFileSync('reference_bundle.js', 'utf8');

const keywords = ["Regression Test Center", "Test Center", "Add item", "Open cart", "Checkout", "Risk Level: LOW", "Status: Ready", "Risk Score: "];
for (const keyword of keywords) {
    const idx = code.indexOf(keyword);
    if (idx !== -1) {
        console.log(`\n\n--- MATCH FOUND FOR: ${keyword} ---`);
        console.log(code.substring(idx - 1000, idx + 3000));
    } else {
        console.log(`\n\n--- NO MATCH FOR: ${keyword} ---`);
    }
}
