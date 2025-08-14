
# Peer Review Survey Web App

## Description

A vdieo tutorial is in development to provide visual aid and clarity.

This project is a **Google Apps Script-powered peer review survey platform** with a **Google Sheets backend** and a **dynamic HTML/CSS/JavaScript frontend**.  
It enables participants to:
- Complete **multiple peer reviews** in a single session.
- Provide **quantitative ratings** via sliders.
- Submit **demographic information** for both peers and the reviewer.
- Receive **real-time feedback** on form completion and survey availability.

The system is designed for **flexibility, scalability, and anonymity**, supporting academic peer review workflows.

---

## Features

- **Dynamic Question Loading** – All peer review and demographic questions are fetched from a backend configuration.
- **Multi-Stage Workflow** – Allows multiple peer reviews before a final submission.
- **Availability Check** – Disables the survey and shows an informative message if the survey is inactive.
- **Validation with Visual Feedback** – Highlights unanswered questions and displays error banners.
- **Batch Data Logging** – Uses optimized Google Sheets writes to reduce latency.
- **Responsive UI** – Built with modular CSS and minimal inline styles.
- **Google Apps Script Integration** – Seamless server–client communication.

---

## Sytem Architecture

- ├── `Code.gs`         # Backend server logic (Google Apps Script)
- ├── `Index.html`      # Main HTML file served by `Script.html`
- ├── `Script.html`     # Frontend AppsScript controlling the UI
- ├── `Styles.html`     # CSS styles for the application
- └── `README.md`       # Documentation

---

## Tech Stack

- **Frontend**: HTML5, CSS3
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Hosting**: Google Apps Script Web App

---

## Documentation

[GitHub Repository Link](https://github.com/SHEFF-99/HIU-Peer-Review-System)

### [1] Initialization
When the app loads, it:
- Fetches the **survey title**.
- Checks **survey status** (`"ACTIVE"` or `"INACTIVE"`).
- Loads **questions** and **label options** from the backend.

### [2] Peer Review Phase
- Displays a series of **slider-based questions**.
- Collects **peer demographic data** via radio buttons.
- Allows multiple peer reviews until `MAX_REVIEWS` is reached.

### [3] Subject Demographics Phase
After completing peer reviews, the user answers **subject demographic questions**.

### [4] Submission
- Validates all inputs.
- Confirms survey is still active.
- Sends all responses to Google Sheets using **`submitResponses`**.

---

## Key Functions

### Backend (`Code.gs`)
- `getTitle()` – Fetches the survey title.
- `checkActiveStatus()` – Returns `"ACTIVE"` or `"INACTIVE"`.
- `getQuestions()` – Returns peer review and demographic questions.
- `submitResponses(responses, subjectData, peerData)` – Saves collected data.
- `logDataToTable(tableName, entries)` – Batch-writes rows to Google Sheets.

### Frontend (`Script.html`)
- `bootstrap()` – Initializes survey UI and checks availability.
- `loadFormContent()` – Renders peer review questions and sliders.
- `loadDemographicForm()` – Renders demographic radio questions.
- `validateSliderAnswers()` / `validateRadioAnswers()` – Input validation.
- `sendResponse()` – Handles peer review phase submission.
- `sendSubmission()` – Handles final submission.

---

## User Interface

- **Sliders** – Styled with textured backgrounds.
- **Buttons** – Consistent appearance with disabled states.
- **Error Banner** – Displays messages for validation errors or system issues.
- **Loader** – Shows while fetching or submitting data.

---

## Deployment

This project is deployed as a Google Apps Script Web App linked to a Google Sheets backend. The following process outlines the complete setup and deployment steps.

### [1] Prepare Google Sheets Backend
- Create a new Google Spreadsheet (this will be the backend database).
- Rename it to a meaningful title (recommended: "Database").
- Download `database.xlsx`, the custom spreadsheet template designed for the system.
- Import the template file into the new Google Sheets file.
- Once loaded, the following sheets should be present:
    - **Responses Table** – Stores all peer review slider responses.
    - **Subjects Table** – Holds subject demographic data.
    - **Subject-Peers Table** – Links subjects to peers for review tracking.
    - **Records Table** – Tracks submission history.
    - **Control Panel** – Stores survey title, status, and the auto-generated QR with instructions for subjects.
    - **Responses, Subjects, and Subject-Peers Queues** – Holds pending data to be processed.
- Populate configuration rows in the setup area.
- In the **Control Panel** sheet:
    - active/nactive status
    - survey title
- In the **Responses Table** sheet:
    - peer review questions
    - slider extreme labels ("extreme negative/extreme positive")
- In the **Subjects Table** sheet:
    - subject demographic questions 
    - subject demographic radio button options
- In the **Subject-Peers Table** sheet:
    - peer demographic questions 
    - peer demographic radio button options
- Ensure each sheet has correct header labels as expected by the script.

### [2] Set Up Google Apps Script Project
- From the spreadsheet, go to Extensions > Apps Script.
- Replace the default `Code.gs` with the provided `Code.gs` file from this repository.
- Add three new HTML files:
    - Index.html – Main HTML structure of the web app.
    - Script.html – Client-side JavaScript controlling survey behavior.
    - Styles.html – CSS styling for all components.
- Paste the provided HTML and CSS code from this repo into the corresponding files.
- Save the project.

### [3] Configure Script Constants and Functions
- In Code.gs, review constants like:
    - MAX_REVIEWS – The maximum number of peer reviews per respondent.
    - STATUS_ACTIVE / STATUS_INACTIVE – Controls survey availability.
- Ensure the following backend functions are present and linked to your spreadsheet structure.
    - checkActiveStatus()
    - getQuestions()
    - submitResponses()
    - processQueues()
- If the instutions were followed correctly, then this should be configured automatically.
       
### [4] Deploy as Web App
- In the Apps Script editor, click Deploy > New deployment.
- Select Web app.
- Under Execute as, choose Me.
- Under Who has access, select:
    - Anyone with the link – For public surveys, or
    - Specific people – For restricted surveys.
- Click Deploy and authorize permissions when prompted.
- Copy the Web App URL generated after deployment.

### [5] Connect Frontend and Backend
- Test the web app link in an incognito browser window to verify:
    - Survey loads when status is ACTIVE.
    - "Survey unavailable" message appears when status is INACTIVE.
- Ensure slider controls and demographic forms save data to the correct backend sheets.
- Test the maximum review limit, validation warnings, and final submission behavior.

### [6] Maintenance & Updates
- To pause the survey, set status to INACTIVE in the configuration sheet.
- To update questions, modify the backend configuration rows—no code changes needed.
- To push code updates, re-deploy using Deploy > Manage deployments.

---

## Privacy and Security

- The system **does not display identifying information** of reviewers to review subjects.
- Responses are stored securely in **Google Sheets**.
- Access is limited to users with appropriate Google permissions.

---

## License

This project is part of an academic research thesis and is provided for educational purposes.  
Contact the project owner for reuse or modification permissions.

---
