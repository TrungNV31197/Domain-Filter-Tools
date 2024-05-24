document.addEventListener("DOMContentLoaded", function () {
    // txtDomainList txtExtension optKeyword txtKeyword optFilter btnStart btnExcel btnCopy
    var domainList = document.getElementById('txtDomainList'),
        extensionList = document.getElementById('txtExtension'),
        keywordOpt = document.getElementById('optKeyword'),
        chkRemoveKw = document.getElementById('chkRemoveKeyword'),
        keywordList = document.getElementById('txtKeyword'),
        filterOpt = document.getElementById('optFilter'),
        resultList = document.getElementById('txtResultList'),
        btnImportExcel = document.getElementById('btnImportExcel'),
        btnStart = document.getElementById('btnStart'),
        btnExcel = document.getElementById('btnExcel'),
        btnCopy = document.getElementById('btnCopy'),
        btnBack = document.getElementById('btnBack');

    var globalResultList = [];

    // Init event
    btnImportExcel.addEventListener("change", importExcel, false);
    btnStart.addEventListener("click", startFilter);
    btnExcel.addEventListener("click", downloadExcel);
    btnCopy.addEventListener("click", copyResult);
    btnBack.addEventListener("click", function () {
        window.location = "index.html";
    });

    // Load default
    loadCookieData();

    // Init Saved data
    function loadCookieData() {
        var extensionList = document.getElementById('txtExtension'),
            keywordList = document.getElementById('txtKeyword');


        var cExtensionList = localStorage.getItem("EXTENSION_LIST"),
            cKeywordList = localStorage.getItem("KETWORD_LIST");

        // Set values
        extensionList.value = cExtensionList;
        keywordList.value = cKeywordList;
    }

    function splitTwice(inputString, firstDelimiter, secondDelimiter) {
        // Split the string based on the first delimiter
        var firstSplit = inputString.split(firstDelimiter);

        // Split each resulting substring based on the second delimiter
        var splitTwiceResult = firstSplit.map(function (subString) {
            return subString.split(secondDelimiter);
        });

        return splitTwiceResult;
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

    function importExcel(event) {
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

          domainList.value = displayData;
        };
    
        reader.readAsArrayBuffer(file);
    }

    // Main function
    function startFilter() {
        if (!domainList.value || domainList.value === '') {
            alert('Domain List is required field!');
            return;
        }

        // Disable Start button
        btnStart.innerText = 'Filtering...';
        // Domain List
        var splits = splitTwice(domainList.value, ' ', '\n');
        // Extension List
        var extensions = extensionList.value ? extensionList.value.split(' ') : [];
        // Keyword Option
        var keywordListVal = keywordList.value ? keywordList.value.split(' ') : [];

        // Merge all arrays in the result array
        var domains = splits.reduce(function (accumulator, currentValue) {
            return accumulator.concat(currentValue);
        }, []);

        // Make filter
        var filteredDomains = new Array();
        var resultDomains = new Array();
        var tempDomains = new Array();
        var hasFilterOpt = false;

        if (extensions != "" && extensions.length > 0) {
            // Reset array before filter
            filteredDomains = [];
            domains.map(domain => {
                // Filter by extension
                var isContains = extensions.some(function (extension) {
                    return domain.indexOf(extension) !== -1;
                });

                // if domain contains extension so add it to filtered domains list
                if (isContains) {
                    filteredDomains.push(domain);
                }
            });

            hasFilterOpt = true;
            tempDomains = filteredDomains.slice();
        } else {
            tempDomains = domains.slice();
        }


        if (keywordListVal != "" && keywordListVal.length > 0) {
            // Reset array before filter
            filteredDomains = [];
            tempDomains.map(domain => {
                // Filter by keyword
                var isContains = keywordListVal.some(function (keyword) {

                    if (keywordOpt.value == "CT") {
                        return domain.indexOf(keyword) !== -1;
                    } else {
                        return domain === keyword;
                    }
                });

                // if domain contains extension so add it to filtered domains list
                if (chkRemoveKw.checked) {
                    if (!isContains) {
                        filteredDomains.push(domain);
                    }
                } else {
                    if (isContains) {
                        filteredDomains.push(domain);
                    }
                }

            });
            hasFilterOpt = true;
        }

        tempDomains = filteredDomains.slice();

        if (!hasFilterOpt) {
            tempDomains = domains.slice();
        }

        // Filter by duplicate domain or keep duplicate domain
        if (tempDomains.length > 0) {
            if (filterOpt.value == "REMOVE") {
                resultDomains = removeDuplicates(tempDomains);
            } else {
                resultDomains = keepOneOfDuplicates(tempDomains);
            }
        }

        // Check the domain is alive or dead
        getDomainStatus(resultDomains)
            .then(function (results) {
                // Print result
                resultList.value = "";
                results.forEach(function (e) {
                    resultList.value += `${e.domain}: ${e.status}` + '\n'; // Append each element followed by a newline
                });

                globalResultList = results;
                btnStart.innerText = 'Start';
            });

        // Save data to cookie
        var extensionValues = document.getElementById('txtExtension').value,
            keywordValues = document.getElementById('txtKeyword').value;
        localStorage.setItem('EXTENSION_LIST', extensionValues);
        localStorage.setItem('KETWORD_LIST', keywordValues);
    }

    // Excel Download button onclick
    function downloadExcel() {
        downloadExcelFile(globalResultList, "Domain.xlsx");
    }

    function urlExists(url, callback) {
        try {
            var proxyUrl = 'https://cors-anywhere.herokuapp.com/' + url;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    callback(xhr.status);
                }
            };
            xhr.open('GET', proxyUrl); // true for asynchronous
            xhr.send();
        } catch (error) {
            callback(error.message);
        }
    }

    function getDomainStatus(domains) {
        // Define a function to check if a single domain is alive
        function checkDomain(domain) {
            return new Promise(function (resolve) {
                urlExists(domain, function (status) {
                    resolve({
                        domain: domain,
                        status: status
                    });
                });
            });
        }

        // Create an array of promises for checking each domain
        var promises = domains.map(function (domain) {
            return checkDomain(domain);
        });

        // Use Promise.all to wait for all promises to resolve
        return Promise.all(promises);
    }

    // Export to Excel File
    function downloadExcelFile(data, filename) {
        // Convert data array of objects to an array of arrays
        const dataArray = data.map(obj => [obj.domain, obj.status]);

        // Convert array of arrays to worksheet
        const worksheet = XLSX.utils.aoa_to_sheet([['Domain', 'Status'], ...dataArray]);

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

    // Function to set a cookie
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
});