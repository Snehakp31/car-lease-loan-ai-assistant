window.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const output = document.getElementById("output");
    const fileName = document.getElementById("fileName");
    const btnText = document.getElementById("btnText");
    const progressBar = document.getElementById("progressBar");
    const statusMessage = document.getElementById("statusMessage");
    const copyBtn = document.getElementById("copyBtn");
    const clearBtn = document.getElementById("clearBtn");
    const charCount = document.getElementById("charCount");

    if (!uploadBtn) {
        console.error("Upload button not found!");
        return;
    }

    console.log("Script loaded successfully!");

    // Prevent any form submission behavior
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            fileName.textContent = file.name;
            hideStatus();
        } else {
            fileName.textContent = "Choose PDF File";
        }
    });

    // Upload button click handler - CRITICAL: Prevent all default behaviors
    uploadBtn.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log("Upload button clicked!");
        handleUpload();
        
        return false;
    }, true);

    async function handleUpload() {
        if (fileInput.files.length === 0) {
            showStatus("Please select a PDF file first", "error");
            return;
        }

        // UI Updates - Start Processing
        uploadBtn.disabled = true;
        btnText.textContent = "Processing...";
        progressBar.classList.remove('hidden');
        hideStatus();
        output.value = "";

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        try {
            // Upload file
            console.log("Starting upload...");
            const uploadRes = await fetch("http://127.0.0.1:5000/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                throw new Error(`Upload failed with status: ${uploadRes.status}`);
            }

            const uploadData = await uploadRes.json();
            console.log("UPLOAD RESULT:", uploadData);

            if (uploadData.error) {
                throw new Error(uploadData.error);
            }

            const fileNameFromServer = uploadData.file_name;

            // Extract text
            console.log("Extracting text...");
            const textRes = await fetch(`http://127.0.0.1:5000/contracts/${fileNameFromServer}`);
            
            if (!textRes.ok) {
                throw new Error(`Extraction failed with status: ${textRes.status}`);
            }

            const textData = await textRes.json();
            console.log("TEXT RESULT:", textData);

            if (textData.extracted_text) {
                output.value = textData.extracted_text;
                updateCharCount();
                showStatus("✓ Text extracted successfully!", "success");
            } else {
                output.value = "No text could be extracted from this PDF.";
                showStatus("No text found in the PDF", "error");
            }

        } catch (err) {
            console.error("Error:", err);
            showStatus("Error: " + err.message, "error");
            output.value = "";
        } finally {
            // Reset UI
            uploadBtn.disabled = false;
            btnText.textContent = "Upload & Extract";
            progressBar.classList.add('hidden');
        }
    }

    // Copy to clipboard
    copyBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (output.value.trim() === "") {
            showStatus("No text to copy!", "error");
            return;
        }

        try {
            await navigator.clipboard.writeText(output.value);
            showStatus("✓ Copied to clipboard!", "success");
            
            // Visual feedback
            copyBtn.style.background = "var(--success)";
            copyBtn.style.color = "white";
            setTimeout(() => {
                copyBtn.style.background = "";
                copyBtn.style.color = "";
            }, 1000);
        } catch (err) {
            showStatus("Failed to copy text", "error");
        }
    });

    // Clear text
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (output.value.trim() === "") {
            return;
        }
        
        if (confirm("Are you sure you want to clear the extracted text?")) {
            output.value = "";
            updateCharCount();
            hideStatus();
            fileName.textContent = "Choose PDF File";
            fileInput.value = "";
        }
    });

    // Update character count
    output.addEventListener('input', updateCharCount);

    function updateCharCount() {
        const count = output.value.length;
        charCount.textContent = `${count.toLocaleString()} character${count !== 1 ? 's' : ''}`;
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                hideStatus();
            }, 3000);
        }
    }

    function hideStatus() {
        statusMessage.classList.add('hidden');
    }
});