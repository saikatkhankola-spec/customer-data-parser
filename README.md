CUSTOMER DATA PARSER
====================

WHAT IT DOES
Customer files are often messy: extra spaces, wrong capital letters,
invalid emails, short phone numbers, empty cells and repeated customers.
This web app reads a CSV or Excel file and cleans it automatically.

On the page, every change is marked:
- Wrong values are crossed out and the corrected value is highlighted.
- Invalid values are circled, with a short note explaining the problem.
- Empty cells are marked as missing.
- Repeated customers (same email) are marked as duplicates.
The cleaned data can be downloaded as a new CSV file.

WHAT IT CLEANS
- Name, City: fixes spacing and capital letters
- Email: makes it lowercase and checks that it is valid
- Phone / Mobile: keeps the digits, removes +91 or a leading 0,
  and checks that 10 digits remain
- Any other column: removes extra spaces

TECHNOLOGIES USED
- Front end: HTML, CSS, JavaScript
- Back end: Python with Flask and pandas

HOW TO RUN IT
1. Install Python (version 3.9 or newer) from python.org.
2. Open a terminal in the project folder and install the packages:
       pip install flask pandas openpyxl
   (or: pip install -r requirements.txt)
3. Start the app:
       python app.py
4. Open this address in your browser:
       http://127.0.0.1:5000
5. Click "Choose a file" and upload a CSV or Excel file,
   or click "Try sample data" to see an example.
6. Press Ctrl+C in the terminal to stop the app.

PROJECT FILES
app.py               Python back end: reads and cleans the uploaded file
templates/index.html The web page
static/style.css     The design
static/script.js     Upload, table display, filters and CSV downloadCUSTOMER DATA PARSER
====================

WHAT IT DOES
Customer files are often messy: extra spaces, wrong capital letters,
invalid emails, short phone numbers, empty cells and repeated customers.
This web app reads a CSV or Excel file and cleans it automatically.

On the page, every change is marked:
- Wrong values are crossed out and the corrected value is highlighted.
- Invalid values are circled, with a short note explaining the problem.
- Empty cells are marked as missing.
- Repeated customers (same email) are marked as duplicates.
The cleaned data can be downloaded as a new CSV file.

WHAT IT CLEANS
- Name, City: fixes spacing and capital letters
- Email: makes it lowercase and checks that it is valid
- Phone / Mobile: keeps the digits, removes +91 or a leading 0,
  and checks that 10 digits remain
- Any other column: removes extra spaces

TECHNOLOGIES USED
- Front end: HTML, CSS, JavaScript
- Back end: Python with Flask and pandas

HOW TO RUN IT
1. Install Python (version 3.9 or newer) from python.org.
2. Open a terminal in the project folder and install the packages:
       pip install flask pandas openpyxl
   (or: pip install -r requirements.txt)
3. Start the app:
       python app.py
4. Open this address in your browser:
       http://127.0.0.1:5000
5. Click "Choose a file" and upload a CSV or Excel file,
   or click "Try sample data" to see an example.
6. Press Ctrl+C in the terminal to stop the app.

PROJECT FILES
app.py               Python back end: reads and cleans the uploaded file
templates/index.html The web page
static/style.css     The design
static/script.js     Upload, table display, filters and CSV download