//selecting all required elements
const dropArea = document.querySelector(".drag-area");
const dragText = dropArea.querySelector("header");
const button = dropArea.querySelector("button");
const input = dropArea.querySelector("input");
let file; //this is a global variable and we'll use it inside multiple functions

let XL_row_object = null;
let progressVal = 0;
let maxMatch = 0;
let dataToSave = null;
const colNames = ["first", "second"];

button.onclick = ()=>{
	input.click(); //if user click on the button then the input also clicked
}

input.addEventListener("change", function(){
	//getting user select file and [0] this means if user select multiple files then we'll select only the first one
	file = this.files[0];
	dropArea.classList.add("active");
	processFile(); //calling function
});
//If user Drag File Over DropArea
dropArea.addEventListener("dragover", (event)=>{
	event.preventDefault(); //preventing from default behaviour
	dropArea.classList.add("active");
	dragText.textContent = "Release to Upload File";
});
//If user leave dragged File from DropArea
dropArea.addEventListener("dragleave", ()=>{
	dropArea.classList.remove("active");
	dragText.textContent = "Drag & Drop to Upload File";
});
//If user drop File on DropArea
dropArea.addEventListener("drop", (event)=>{
	event.preventDefault(); //preventing from default behaviour
	//getting user select file and [0] this means if user select multiple files then we'll select only the first one
	file = event.dataTransfer.files[0];
	processFile(); //calling function
});

const goBtn = document.querySelector("#goButton");
goBtn.disabled = true;
goBtn.onclick = () => {
	if (XL_row_object != null) {
		progressVal = 0;
		maxMatch = 0;
		
		let matchCountLimit = document.querySelector("#numColumn").value;
		let keys = Object.keys(XL_row_object);

		maxMatch = 0;
		dataToSave = [];
		toggleProgressVisibility(true).then(() => {
			
			performTask(XL_row_object, keys, function(rows, keys, index) {
				let keyLeft = keys[index];
				for (var j = index + 1; j < keys.length; j++) {
					let keyRight = keys[j];
					let mCount = countMatcingValues( XL_row_object[keyLeft], XL_row_object[keyRight] );
					if (mCount >= matchCountLimit) {
						let row = {};
						row[colNames[0]] = keyLeft;
						row[colNames[1]] = keyRight;
						dataToSave.push(row);
					}
					maxMatch = Math.max(mCount, maxMatch);
				}
				
			});
		});
	}
}

function resetGlobals() {
	XL_row_object = null;
	progressVal = 0;
	maxMatch = 0;
}

function toggleProgressVisibility(visible) {
	return new Promise((resolve) => {
		document.querySelector(".progress-container").style.visibility = visible ? "visible" : "hidden";
		resolve(true);
		return;
	});
}

function performTask(rows, keys, processItem) {
    var pos = 0;
	
    function iteration() {
		processItem(rows, keys, pos);
        pos += 1;
		// progressVal update
		progressVal = pos * 100 / keys.length;
		progressVal = Math.min(100, progressVal) % 100;
		document.getElementById("myprogress").value = progressVal;
		document.getElementById("progress-text").innerText = Math.round(progressVal);
		
        // Only continue if there are more items to process.
        if (pos < keys.length)
            setTimeout(iteration, 10); // Wait 10 ms to let the UI update.
		else {
			progressVal = 100;
			toggleProgressVisibility(false).then(() => {
				console.log("maxMatch : ", maxMatch);
				exportFile(colNames, dataToSave, "matches.xls");
			});
		}
    }
    iteration();
}

function exportFile(headers, data, fileName) {

	let ws = XLSX.utils.json_to_sheet(data, {header: headers});
	let wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
	XLSX.writeFile(wb, fileName, { bookType : "xls" });
}

function processFile() {
	resetGlobals();
	let fileType = file.type; //getting selected file type
	//console.log(fileType);
	if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
		console.log("Correct file format");
		let reader = new FileReader();
	  
		reader.onload = function(e) {var data = e.target.result;
			var workbook = XLSX.read(data, {
				type: 'binary'
			});
			
			workbook.SheetNames.forEach(function(sheetName) {
				XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
				goBtn.disabled = false;
			});
		};
		reader.onerror = function(ex) {
			console.log(ex);
		};
		
		reader.readAsBinaryString(file);
	}
}

function countMatcingValues(first, second) {
	var result = 0;
	Object.keys(first).forEach(function(colName) {
		if (first[colName] === second[colName]) {
			result++;
		}
	});
	return result;
}