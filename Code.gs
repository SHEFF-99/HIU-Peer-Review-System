// Code.gs

// --- Configuration and Constants ---
// Centralized references for sheet names and status values.
const SHEETS = {
  RESPONSES_TABLE: 'Responses Table',
  SUBJECTS_TABLE: 'Subjects Table',
  SUBJECT_PEERS_TABLE: 'Subject-Peers Table',
  RECORDS_TABLE: 'Records Table',
  CONTROL_PANEL: 'Control Panel',
  RESPONSES_QUEUE: 'Responses Queue',
  SUBJECTS_QUEUE: 'Subjects Queue',
  SUBJECT_PEERS_QUEUE: 'Subject-Peers Queue'
};

const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};



/** 
 * onOpen()
 * 
 * Adds a custom "Peer Review" menu to the spreadsheet UI when the file is opened.
 *
 * Menu options:
 * - "Open Webpage": Opens the front-end survey form.
 * - "Process Results": Triggers processing of pending form responses.
 *
 * Why:
 * Enhancing the spreadsheet UI improves usability for administrators
 * who may not work directly with the script editor.
 * 
 * Note:
 * If the menu does not appear immediately after editing this file,
 * try reloading the sheet or waiting a few seconds post-open.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Peer Review')
    .addItem('Open Webpage', 'openWebpage')
    .addItem('Process Results', 'processQueues')
    .addToUi();
}



/**
 * openWebpage()
 *
 * Opens the survey form in a new browser tab using the URL defined in the sheet.
 *
 * The URL is retrieved from cell A3 in the "Control Panel" sheet.
 * A modal dialog is used as a bridge to open the link via JavaScript.
 *
 * Why:
 * Browser security rules restrict scripts from opening tabs directly via menu actions.
 * This workaround uses "HtmlService" to inject a one-time script into a modal,
 * enabling tab opening on behalf of the user.
 *
 * Tips:
 * - Ensure pop-ups are not blocked for this domain.
 * - Cell A3 must contain a valid URL for this to work.
 * 
 * @throws {Error} - If the URL cell is blank, a warning is logged.
 */
function openWebpage() {
  const controlPanel = getSheetOrThrow(SHEETS.CONTROL_PANEL);
  const url = controlPanel.getRange(3,1).getValue();
  if(!url){
    console.warn('[openWebpage] No URL found in Control Panel cell A3.');
  }

  const scriptInput = `<script>window.open('${url}');google.script.host.close();</script>`;
  const scriptOutput = HtmlService.createHtmlOutput(scriptInput);

  console.log(`[openWebpage] Opening webpage at URL: ${url}`);
  SpreadsheetApp.getUi().showModalDialog(scriptOutput, 'Opening New Tab');
}



/**
 * doGet(e)
 *
 * Entry point for GET requests to the web app.
 * Loads the front-end HTML template and returns it to the browser.
 *
 * X-Frame-Options is disabled to allow iframe embedding.
 *
 * Why:
 * Using a modular "Index.html" template improves separation of front-end logic.
 * Disabling X-Frame-Options allows the app to be embedded in other platforms.
 *
 * @param {Object} e - GET request event object (not used in this implementation).
 * @returns {HtmlOutput} - The rendered HTML content.
 */
function doGet(e) {
  const indexStructure = HtmlService.createTemplateFromFile("Index");
  const indexTemplate = indexStructure.evaluate();
  
  return indexTemplate.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}



/**
 * getTitle()
 *
 * Retrieves the title of the survey from the "Control Panel" sheet.
 * The title is stored in cell A2 (row 2, column 1).
 *
 * Why:
 * Allows non-developers to modify the form title directly from the sheet
 * without editing the script or UI code.
 *
 * @returns {string} - The survey title.
 */
function getTitle() { 
  const controlPanel = getSheetOrThrow(SHEETS.CONTROL_PANEL);

  return controlPanel.getRange(2, 1).getValue();
}



/**
 * checkActiveStatus()
 *
 * Reads the survey's current availability status from the sheet.
 * Valid statuses are "ACTIVE" and "INACTIVE", found in cell B2 of the Control Panel.
 *
 * If the value is unrecognized or missing, the function defaults to "INACTIVE"
 * and logs a warning for developers or admins.
 *
 * Why:
 * Enables spreadsheet-level control over the app's availability without modifying code.
 *
 * @returns {string} - Either "ACTIVE" or "INACTIVE".
 */
function checkActiveStatus() {
  const controlPanel = getSheetOrThrow(SHEETS.CONTROL_PANEL);
  const status = controlPanel.getRange(2, 2).getValue();
  if(status === "ACTIVE" || status === "INACTIVE") {
    return status;
  }

  console.warn(`[checkActiveStatus] Unexpected status value "${status}", defaulting to "${STATUS.INACTIVE}".`);

  return "INACTIVE";
}



/**
 * getQuestions()
 *
 * Loads all form content: peer review questions, demographic questions, and options.
 * Content is dynamically retrieved from three separate sheets.
 *
 * Structure:
 * - Peer review survey: Sourced from "Responses Table"
 * - Subject demographics form: Sourced from "Subjects Table"
 * - Peer demographics form: Sourced from "Subject-Peers Table"
 *
 * Why:
 * Makes the survey customizable directly from the sheet with no code changes required.
 * Enables flexible and dynamic form generation.
 *
 * Assumptions:
 * - Questions are in row 1; options are in row 2.
 * - For the Responses Table and Subjects Table, questions begin at column B (to skip the ID column).
 * - For the Subject-Peers Table, questions begin at column C (to skip the 2 ID columns).
 * - Options are provided as slash-separated strings (e.g., "Yes/No").
 *
 * @returns {Object} - An object with 6 fields:
 *   @property {string[]} questions - Peer review questions.
 *   @property {Array<string[]>} labelOptions - Extreme negative/positive labels for each slider.
 *   @property {string[]} subjectDemographicQuestions
 *   @property {Array<string[]>} subjectDemographicOptions
 *   @property {string[]} peerDemographicQuestions
 *   @property {Array<string[]>} peerDemographicOptions
 */
function getQuestions() {
  // --- Peer Review Questions & Slider Labels ---
  const responsesTable = getSheetOrThrow(SHEETS.RESPONSES_TABLE);
  const questions = responsesTable.getRange(1, 2, 1, responsesTable.getLastColumn() - 1).getValues()[0];
  const labelOptionLists = responsesTable.getRange(2, 2, 2, responsesTable.getLastColumn() - 1).getValues()[0];
  const labelOptions = splitOptions(labelOptionLists);

  // --- Subject Demographic Questions & Options ---
  const subjectsTable = getSheetOrThrow(SHEETS.SUBJECTS_TABLE);
  const subjectDemographicQuestions = subjectsTable.getRange(1, 2, 1, subjectsTable.getLastColumn() - 1).getValues()[0];
  const subjectDemographicOptionLists = subjectsTable.getRange(2, 2, 2, subjectsTable.getLastColumn() - 1).getValues()[0];
  const subjectDemographicOptions = splitOptions(subjectDemographicOptionLists);  
  
  // --- Peer Demographic Questions & Options ---
  const subjectPeersTable = getSheetOrThrow(SHEETS.SUBJECT_PEERS_TABLE);
  // Column A = Subject ID, column B = Peer ID, questions start at column C (index 3).
  const peerDemographicQuestions = subjectPeersTable.getRange(1, 3, 1, subjectPeersTable.getLastColumn() - 2).getValues()[0];
  const peerDemographicOptionLists = subjectPeersTable.getRange(2, 3, 2, subjectPeersTable.getLastColumn() - 2).getValues()[0];
  const peerDemographicOptions = splitOptions(peerDemographicOptionLists);

  // Package and return all loaded data in a structured object.
  return {
    questions: questions, 
    labelOptions: labelOptions, 
    subjectDemographicQuestions: subjectDemographicQuestions, 
    subjectDemographicOptions: subjectDemographicOptions, 
    peerDemographicQuestions: peerDemographicQuestions, 
    peerDemographicOptions: peerDemographicOptions
  };
}



/**
 * splitOptions(optionsString)
 *
 * Splits slash-separated option strings into arrays.
 * For example, "Yes/No/Maybe" becomes ["Yes", "No", "Maybe"].
 *
 * If an input string is empty, null is inserted in the output array.
 * This helps maintain positional consistency for related datasets.
 *
 * Why:
 * This format keeps spreadsheet input human-readable while
 * enabling easy parsing into frontend-ready data.
 *
 * @param {string[]} optionsString - Array of strings with slash-separated options.
 * @returns {Array<string[] | null>} - A 2D array where each item is either an array of options or null.
 */
function splitOptions(optionsString) {
  return optionsString.map(cell => cell ? cell.split("/") : null);
}



/**
 * submitResponses(responses, subjectDemographicData, peerDemographicData)
 * 
 * Submits a user's peer review data to staging queues for later processing.
 *
 * Inserts a batch of peer review responses and demographic data (for both the subject and peers)
 * into their respective queue sheets. All rows are tagged with a shared timestamp for grouping.
 *
 * Why:
 * - Ensures atomic grouping of related entries without locking by using a shared timestamp.
 * - Defers processing to avoid blocking the user interface and reduce race conditions.
 * - Maintains data separation by queue type for clearer processing logic and lower coupling.
 *
 * @param {Array<Array<any>>} responses - List of individual peer review response arrays.
 * @param {Array<any>} subjectDemographicData - Flat array of demographic data for the subject.
 * @param {Array<Array<any>>} peerDemographicData - List of arrays for each peer's demographic data.
 * @throws {Error} - If any input is not an array or required sheets are missing.
 */
function submitResponses(responses, subjectDemographicData, peerDemographicData) {
  if(!Array.isArray(responses) || !Array.isArray(subjectDemographicData) || !Array.isArray(peerDemographicData)) {
    throw new Error('[submitResponses] All inputs must be arrays.');
  }

  const timestamp = new Date().getTime();
  // TEST LATER: const timestamp = new Date().toISOString(); // ISO string chosen for readability in the queue.

  // Helper wrappers for queue data.
  const responsesQueue = getSheetOrThrow(SHEETS.RESPONSES_QUEUE);
  const subjectsQueue = getSheetOrThrow(SHEETS.SUBJECTS_QUEUE);
  const subjectPeersQueue = getSheetOrThrow(SHEETS.SUBJECT_PEERS_QUEUE);

  // Responses Queue: Possibly multiple responses per submission.
  if(responses.length > 0) {
    const timestampedResponses = responses.map(responseEntry => [timestamp, ...responseEntry]);
    const startingResponseRow = responsesQueue.getLastRow() + 1;
    responsesQueue.getRange(startingResponseRow, 1, timestampedResponses.length, timestampedResponses[0].length).setValues(timestampedResponses);
  }

  // Subject Queue: Single row, 1 subject per submission.
  subjectsQueue.appendRow([timestamp, ...subjectDemographicData]);

  // Peer Queue: Possibly multiple peers per submission. 
  if(peerDemographicData.length > 0) {
    const timestampedPeersData = peerDemographicData.map(peerDataEntry => [timestamp, ...peerDataEntry]);
    const startingPeerRow = subjectPeersQueue.getLastRow() + 1;
    subjectPeersQueue.getRange(startingPeerRow, 1, timestampedPeersData.length, timestampedPeersData[0].length).setValues(timestampedPeersData);
  }
}



/**
 * processQueues()
 * 
 * Processes all queued peer review submissions and writes normalized results to output tables.
 *
 * Consolidates interleaved timestamped entries from queue sheets and transforms them into
 * structured records, assigning unique IDs to subjects and responses, and linking peer metadata.
 *
 * Why:
 * - Maintains safe concurrency via timestamp-based grouping.
 * - Preserves order and referential integrity by assigning IDs after grouping.
 * - Avoids mid-submission conflicts by only executing when system is marked as inactive.
 *
 * @throws {Error} - If any output table write fails or queues cannot be cleared safely.
 */
function processQueues() {
  // Avoid mutating while live.
  if(checkActiveStatus() === STATUS.ACTIVE) return;

  const database = SpreadsheetApp.getActiveSpreadsheet();
  console.log(`[processQueues] Starting at ${new Date().toISOString()}`);

  const responsesQueue = getSheetDataSorted(database, SHEETS.RESPONSES_QUEUE);
  const subjectsQueue = getSheetDataSorted(database, SHEETS.SUBJECTS_QUEUE);
  const subjectPeersQueue = getSheetDataSorted(database, SHEETS.SUBJECT_PEERS_QUEUE);

  // Get last used IDs to continue sequences.
  let newResponseID = getLastIDfromTable(SHEETS.RESPONSES_TABLE);
  let newSubjectID = getLastIDfromTable(SHEETS.SUBJECTS_TABLE);

  const responsesTableOutput = [];
  const subjectsTableOutput = [];
  const subjectPeersTableOutput = [];
  const recordsTableOutput = [];

  // Process subjects in chronological order.
  subjectsQueue.forEach(subjectRow => {
    newSubjectID++;
    const timestamp = subjectRow[0];
    const subjectData = subjectRow.slice(1);
    subjectsTableOutput.push([newSubjectID, ...subjectData]);

    // Group related raw data by the shared timestamp.
    const matchingResponses = responsesQueue.filter(row => row[0] === timestamp);
    const matchingPeers = subjectPeersQueue.filter(row => row[0] === timestamp);

    // Basic sanity check: Number of peers should match number of responses per expectation.
    if(matchingPeers.length !== matchingResponses.length) {
      console.warn(`[processQueues] Timestamp "${timestamp}" 
        has ${matchingPeers.length} peer entries 
        but ${matchingResponses.length} response entries.`
      );
    }

    matchingPeers.forEach((peerRow, index) => {
      newResponseID++;
      // Remove the timestamps for the table entries.
      const responseData = matchingResponses[index]?.slice(1) || [];
      const peerData = peerRow.slice(1);
      const newPeerID = index + 1;
      
      responsesTableOutput.push([newResponseID, ...responseData]);
      subjectPeersTableOutput.push([newSubjectID, newPeerID, ...peerData]);
      recordsTableOutput.push([newResponseID, newSubjectID, newPeerID]);
    });
  });
 
  // Write outputs and clear queues only if writes succeed.
  try {
    logDataToTable(SHEETS.RESPONSES_TABLE, responsesTableOutput);
    logDataToTable(SHEETS.SUBJECTS_TABLE, subjectsTableOutput);
    logDataToTable(SHEETS.SUBJECT_PEERS_TABLE, subjectPeersTableOutput);
    logDataToTable(SHEETS.RECORDS_TABLE, recordsTableOutput); 

    // If all writes succeeded, clear the input queues.
    clearQueue(SHEETS.RESPONSES_QUEUE);
    clearQueue(SHEETS.SUBJECTS_QUEUE);
    clearQueue(SHEETS.SUBJECT_PEERS_QUEUE);
  
    console.log(`[processQueues] Completed. 
      Subjects: ${subjectsTableOutput.length}, 
      Responses: ${responsesTableOutput.length}, 
      Peers: ${subjectPeersTableOutput.length}`);
  } catch (err) {
    console.error('[processQueues] Write failure, queues preserved:', err);
    throw err;
  }
}



/**
 * getSheetDataSorted(spreadsheet, sheetName)
 * 
 * Fetches and returns all non-header data from a named sheet, sorted by timestamp (column A).
 *
 * Why:
 * Ensures consistent chronological ordering of queue data for grouping by timestamp.
 * Sorting up front simplifies processing logic and avoids interleaving issues.
 *
 * @param {Spreadsheet} spreadsheet - The active Google Spreadsheet instance.
 * @param {string} sheetName - The name of the sheet to read and sort.
 * @returns {Array<Array<any>>} - Sorted 2D array of data rows.
 * @throws {Error} - If the sheet does not exist.
 */
function getSheetDataSorted(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if(!sheet) throw new Error(`[getSheetDataSorted] Sheet "${sheetName}" not found.`);

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // getRange() throws errors if the data set is empty.
  // Check if there is more than 1 row since row 1 is used for column headers.
  if(lastRow <= 1) return [];
  
  const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  range.sort([{ column: 1, ascending: true}]);

  return range.getValues();
}



/**
 * getLastIDfromTable(tableName)
 * 
 * Retrieves the last numerical ID from the specified output table.
 *
 * Why:
 * Allows ID generation to continue from the last written value while gracefully handling
 * empty sheets or malformed rows by returning 0 in those cases.
 *
 * @param {string} tableName - The name of the table sheet to inspect.
 * @returns {number} -  Last used ID in column A, or 0 if none.
 * @throws {Error} - If the table does not exist.
 */
function getLastIDfromTable(tableName) {
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tableName);
  if(!sheet) throw new Error(`[getLastIDfromTable] Table "${tableName}" not found.`);

  const lastRow = sheet.getLastRow();
  if(lastRow <= 1) return 0;

  const lastID = sheet.getRange(lastRow, 1).getValue();

  return (typeof lastID === 'number') ? lastID : 0;
}



/**
 * clearQueue(queueName)
 * 
 * Clears all rows (excluding headers) from a queue sheet.
 *
 * Why:
 * Ensures that already-processed data is not re-ingested. Preserves safety by only
 * clearing after successful writes.
 *
 * @param {string} queueName - The name of the queue sheet to clear.
 * @throws {Error} - If the queue sheet is missing.
 */
function clearQueue(queueName) {  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(queueName);
  if(!sheet) throw new Error(`[clearQueue] Queue "${queueName}" not found.`);

  // lastRow is used instead of queue.getLastRow() because the range could go out of bounds if there's only 1 row.
  const lastRow = sheet.getLastRow();
  if(lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
  }
}



/**
 * logDataToTable(tableName, entries)
 * 
 * Appends an array of rows to the end of a table sheet in bulk.
 *
 * Why:
 * Reduces write latency and avoids partial persistence by using batch operations
 * instead of repeated "appendRow" calls.
 *
 * @param {string} tableName - The name of the table sheet to append to.
 * @param {Array<Array<any>>} entries - The array of row arrays to append.
 * @throws {Error} - If the sheet is missing or input is malformed.
 */
function logDataToTable(tableName, entries) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tableName);
  if(!sheet) throw new Error(`[logDataToTable] Table "${tableName}" not found.`);

  if(entries.length === 0) { // No entries to write.
    const startRow = sheet.getLastRow() + 1;

    // TEST: Tables not saving data after processing...
    sheet.getRange(startRow, 1, entries.length, entries[0].length).setValues(entries);
  }
}



/**
 * getSheetOrThrow(name)
 * 
 * Utility to get a sheet by name or throw a descriptive error if not found.
 *
 * Why:
 * Centralizes defensive error handling and reduces repeated null checks.
 *
 * @param {string} name - The name of the sheet to retrieve.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} - The found sheet.
 * @throws {Error} - If the sheet is not found.
 */
function getSheetOrThrow(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if(!sheet) throw new Error(`[getSheetOrThrow] Required sheet "${name}" not found.`);

  return sheet;
}



/**
 * include(filename)
 * 
 * Injects HTML partials into rendered templates.
 *
 * Why:
 * Enables modular front-end development by allowing reuse of shared HTML snippets
 * (e.g., headers, footers, scripts) without duplicating code across views.
 *
 * @param {string} filename - The name of the HTML file (without extension).
 * @returns {string} - Raw HTML content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
