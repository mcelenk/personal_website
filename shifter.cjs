const fs = require('fs');

// Input and output file paths
const inputFile = './public/drawing_data/monroe.json';
const outputFile = './public/drawing_data/monroe_OUT.json';

// Shift values
const shiftX = 100;
const shiftY = 2000;

// Read the input JSON file
fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading the file: ${err.message}`);
        return;
    }

    // Parse the JSON data
    let jsonArray;
    try {
        jsonArray = JSON.parse(data);
    } catch (parseError) {
        console.error(`Error parsing the JSON file: ${parseError.message}`);
        return;
    }

    // Shift x and y values
    const shiftedArray = jsonArray.map(item => ({
        x: item.x + shiftX,
        y: item.y + shiftY
    }));

    // Write the shifted data to the output JSON file
    fs.writeFile(outputFile, JSON.stringify(shiftedArray, null, 2), 'utf8', writeError => {
        if (writeError) {
            console.error(`Error writing to the file: ${writeError.message}`);
            return;
        }
        console.log(`Shifted JSON has been written to ${outputFile}`);
    });
});
