const fs = require('fs');
console.log("Writing a dummy image...");
fs.writeFileSync('dummy.jpg', 'fake image data');
