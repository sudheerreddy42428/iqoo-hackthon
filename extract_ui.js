const fs = require('fs');

const code = fs.readFileSync('reference_bundle.js', 'utf8');

// The react compiled code is usually n.jsx("div", {className: "..." ...}) or similar.
// We are looking for "Regression Test Center" or "Risk Level" or "Regression Test".
// Let's just find the index of "Regression Test Center" and grab a large chunk of code around it.

const keywords = ["Regression Test Center", "Test Center", "Add item", "Open cart", "Checkout"];
for (const keyword of keywords) {
    const idx = code.indexOf(keyword);
    if (idx !== -1) {
        console.log(`\n\n--- MATCH FOUND FOR: ${keyword} ---`);
        console.log(code.substring(idx - 1000, idx + 3000));
    }
}
