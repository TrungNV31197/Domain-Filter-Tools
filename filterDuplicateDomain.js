document.addEventListener("DOMContentLoaded", function () {
    // txtDomainList txtExtension optKeyword txtKeyword optFilter btnStart btnExcel btnCopy
    var domainListA = document.getElementById('txtDomainListA'),
        domainListB = document.getElementById('txtDomainListB'),
        btnImportExcelA = document.getElementById('btnImportExcelA'),
        btnImportExcelB = document.getElementById('btnImportExcelB'),
        resultList = document.getElementById('txtResultList'),
        btnStart = document.getElementById('btnStart'),
        btnExcel = document.getElementById('btnExcel'),
        btnCopy = document.getElementById('btnCopy'),
        btnBack = document.getElementById('btnBack');

    var globalResultList = [];

    // Init event
    btnImportExcelA.addEventListener("change", importExcelA, false);
    btnImportExcelB.addEventListener("change", importExcelB, false);
    btnStart.addEventListener("click", startFilter);
    btnExcel.addEventListener("click", downloadExcel);
    btnCopy.addEventListener("click", copyResult);
    btnBack.addEventListener("click", function () {
        window.location = "index.html";
    });

    function splitTwice(inputString, firstDelimiter, secondDelimiter) {
        // Split the string based on the first delimiter
        var firstSplit = inputString.split(firstDelimiter);

        // Split each resulting substring based on the second delimiter
        var splitTwiceResult = firstSplit.map(function (subString) {
            return subString.split(secondDelimiter);
        });

        return splitTwiceResult;
    }

    function importExcelA(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
    
        reader.onload = function(e) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
    
          // Assuming the first sheet is the one we want to read
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
          // Remove the first row to start from A2
          const columnAData = json.slice(1).map(row => row[0]).filter(cell => cell !== undefined);
    
          const displayData = columnAData.join('\n');

          domainListA.value = displayData;
        };
    
        reader.readAsArrayBuffer(file);
    }

    function importExcelB(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
    
        reader.onload = function(e) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
    
          // Assuming the first sheet is the one we want to read
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
          // Remove the first row to start from A2
          const columnAData = json.slice(1).map(row => row[0]).filter(cell => cell !== undefined);
    
          const displayData = columnAData.join('\n');

          domainListB.value = displayData;
        };
    
        reader.readAsArrayBuffer(file);
    }

    function keepOneOfDuplicates(array) {
        // Create a Set from the array to remove duplicate values
        const uniqueSet = new Set(array);
        
        // Convert the Set back to an array
        const uniqueArray = Array.from(uniqueSet);
        
        return uniqueArray;
    }
    

    // Function to keep duplicate items in an array
    function keepDuplicates(array) {
        var duplicateArray = [];
        var seen = {};

        array.forEach(function (item) {
            if (seen.hasOwnProperty(item)) {
                duplicateArray.push(item);
            } else {
                seen[item] = true;
            }
        });

        return duplicateArray;
    }

    // Function to remove duplicate items from an array
    function removeDuplicates(array) {
        // Create a frequency map of elements
        const frequencyMap = array.reduce((map, item) => {
            map[item] = (map[item] || 0) + 1;
            return map;
        }, {});

        // Filter out elements with frequency greater than 1
        return array.filter(item => frequencyMap[item] === 1);
    }

    function copyTextToClipboard() {
        // Create a textarea element
        var textarea = document.getElementById('txtResultList');

        // Select the text within the textarea
        textarea.select();

        // Copy the selected text to the clipboard
        document.execCommand("copy", true);
    }

    // Copy result list
    function copyResult() {
        copyTextToClipboard();
    }

    // Main function
    function startFilter() {
        if (!domainListA.value || !domainListB.value) {
            alert('Domain List is required field!');
            return;
        }

        // Disable Start button
        btnStart.innerText = 'Filtering...';
        // Domain List
        var splitsA = splitTwice(domainListA.value, ' ', '\n');
        var splitsB = splitTwice(domainListB.value, ' ', '\n');

        // Merge all arrays in the result array
        var domainsA = splitsA.reduce(function (accumulator, currentValue) {
            return accumulator.concat(currentValue);
        }, []);

        // Merge all arrays in the result array
        var domainsB = splitsB.reduce(function (accumulator, currentValue) {
            return accumulator.concat(currentValue);
        }, []);
        
        // Make filter
        var resultDomains = new Array();

        const mergedArray = [...domainsA, ...domainsB];

        resultDomains = keepOneOfDuplicates(mergedArray);

        // Print result
        resultList.value = resultDomains.join('\n');
        globalResultList = resultDomains;
        btnStart.innerText = 'Start';
    }

    // Excel Download button onclick
    function downloadExcel() {
        var resultList = document.getElementById('txtResultList');
        // Domain List
        var data = splitTwice(resultList.value, ' ', '\n');
        // Transpose the data
        //const transposedData = data[0].map((col, i) => data.map(row => row[i]));
        downloadExcelFile(globalResultList, "Domain.xlsx");
    }

    // Export to Excel File
    function downloadExcelFile(data, filename) {
        // Convert data array of objects to an array of arrays
        const dataArray = data.map(obj => [obj]);

        // Convert array of arrays to worksheet
        const worksheet = XLSX.utils.aoa_to_sheet([['Domain'], ...dataArray]);

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        // Autofit columns
        autofitColumns(worksheet);

        // Generate binary string from workbook
        const binaryString = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

        // Convert binary string to Blob
        const blob = new Blob([s2ab(binaryString)], { type: 'application/octet-stream' });

        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        // Append the link to the body
        document.body.appendChild(link);

        // Trigger the download
        link.click();

        // Clean up
        document.body.removeChild(link);
    }

    function autofitColumns(worksheet) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let max_width = 0;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!worksheet[cell_ref]) continue;
                const cell_value = worksheet[cell_ref].v;
                const cell_text_width = cell_value.length;
                if (cell_text_width > max_width) {
                    max_width = cell_text_width;
                }
            }
            const col_width = max_width > 0 ? (max_width + 2) * 1.1 : 10;
            worksheet['!cols'] = worksheet['!cols'] || [];
            worksheet['!cols'][C] = { wch: col_width };
        }
    }

    // Utility function to convert string to ArrayBuffer
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }
});