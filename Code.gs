// Code.gs

/**
 * Adds a custom menu tab to the Google Sheets UI when the spreadsheet is opened.
 * 
 * Automatically triggered when the spreadsheet is opened. 
 * Adds a new menu tab called "Peer Review" to the toolbar, 
 * containing one item labeled "Open Webpage". 
 * When this item is selected, the openWebpage() function is invoked.
 */
function onOpen() {

  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Peer Review')
    .addItem('Open Webpage', 'openWebpage')
    .addToUi();
}



/**
 * Opens a new browser tab with the URL specified in cell 3A of Sheet3.
 * 
 * Opens Sheet3 and gets the URL string from cell 3A.
 * Displays a modal dialog box to the user, triggering the new tab.
 * Runs a short HTML script that opens the URL in a new tab and closes the dialog.
 */
function openWebpage() {

  const book = SpreadsheetApp.getActiveSpreadsheet();

  // set the active sheet to Sheet3 (at sheet index 2)
  book.setActiveSheet(book.getSheets()[2]);

  // get Sheet3 for webpage url (ACTIVE or INACTIVE)
  var sheet3 = book.getActiveSheet();

  // contents of cell 3A = wepage url
  var url = sheet3.getRange(3,1).getValue();  

  // build the script with the URL
  var script = "<script>window.open('" + url + "');google.script.host.close();</script>";

  // link the script to the user interface to output
  var userInterface = HtmlService.createHtmlOutput(script);

  // open a modal dialog box to run the script
  SpreadsheetApp.getUi().showModalDialog(userInterface, 'Opening New Tab')
}



/**
  Initializes the web app's HTML page.

  This function is the entry point for HTTP GET requests to the web app.
  It loads the Index.html file, 
  evaluates it as a template, 
  and sets the X-Frame-Options to allow embedding in iframes from any origin.

  @param {Object} e, The event parameter (not used in this function)
  @returns {HtmlOutput} The evaluated HTML template with modified XFrameOptions
  */
function doGet(e) {
  
  var x = HtmlService.createTemplateFromFile("Index");

  var y = x.evaluate();

  var z = y.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return z;
}



/**
  Retrieves the value from cell 2A of the active sheet.
  
  The initial active sheet is always be Sheet1 (at sheet index 0).
  This function gets the active spreadsheet and sheet, 
  reads the value in cell 2A (second row, first column), 
  and returns it.

  @returns {string} The value in cell 2A of the active sheet (Sheet1)
  */
function title() {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // contents of cell 2A = survey title
  var titleString = sheet.getRange(2,1).getValue(); 

  return titleString;
}



/**
 * Retrieves the current survey status from Sheet3.
 * 
 * Opens Sheet3, reads the value from cell 2B.
 * Returns the value, which represents the current status of the survey.
 * 
 * @returns {string} The current status of the survey from cell 2B ("ACTIVE" or "INACTIVE")
 */
function checkActiveStatus() {

  const book = SpreadsheetApp.getActiveSpreadsheet();

  // set the active sheet to Sheet3 (at sheet index 2)
  book.setActiveSheet(book.getSheets()[2]);

  // get Sheet3 for survey status (ACTIVE or INACTIVE)
  var sheet3 = book.getActiveSheet();

  // contents of cell 2B = survey status
  var status = sheet3.getRange(2,2).getValue();

  return status;
}



/**
 * Retrieves peer review survey and demographic form questions along with their response options.
 * 
 * This function processes two sheets:
 *    - Sheet1 (index 0): Contains peer review questions and slider label options.
 *    - Sheet2 (index 1): Contains demographic questions and radio button options.
 * 
 * For each section, it reads the text of the questions and parses their respective options.
 * 
 * Returns an object containing:
 *    - questions: An array of peer review question texts.
 *    - labelOptions: A 2D array where each sub-array contains the two extreme labels for a slider.
 *    - demographicQuestions: An array of demographic question texts.
 *    - demographicOptions: A 2D array of radio button labels for each demographic question.
 * 
 * @returns {Object} An object with four properties:
 *    - questions: {string[]}
 *    - labelOptions: {Array<string[] | null>}
 *    - demographicQuestions: {string[]}
 *    - demographicOptions: {Array<string[] | null>}
 */
function questions() {

  const book = SpreadsheetApp.getActiveSpreadsheet();

  // Sheet1 is the active sheet by default
  var sheet1 = book.getActiveSheet();


  // Sheet1 Process
  // PEER REVIEW SURVEY DATA is stored in 2 arrays: "questions" and "labelOptions"

  // questions: array of question texts, read contents from cell 1C to the last non-empty column
  var questions = sheet1.getRange(1, 3, 1, sheet1.getLastColumn() - 2).getValues()[0]; 

  // temporary array of label lists, read from cell 2C to the last non-empty column
  var labels = sheet1.getRange(2, 3, 1, sheet1.getLastColumn() - 2).getValues()[0];
  // each cell in "labels" can hold a string containing the negative and positve extreme labels,
  // seperated by a slash (/)

  // labelOptions: 2D array of the slider extreme labels for the questions
  var labelOptions = labels.map(function(cell) {
    // process each cell's contents
    if (cell) { 
      // if the cell in not null, split the cell at the slash (/)
      return cell.split("/");
    }
    else {
      // if the cell is null, leave null
      return null;
      // the default label options (Extreme Negative/Extreme Positive) will be applied when loaded
    }
  })


  // Sheet2 Process
  // DEMOGRAPHIC FORM DATA is stored in 2 arrays: "demographicQuestions" and "demographicOptions"

  // set the active sheet to Sheet2 (at sheet index 1)
  book.setActiveSheet(book.getSheets()[1]);

  // get Sheet2 for the demographic form data
  var sheet2 = book.getActiveSheet();
  
  // demographicQuestions: array of question texts, read contents from cell 1B to the last non-empty column
  var demographicQuestions = sheet2.getRange(1, 2, 1, sheet2.getLastColumn() - 1).getValues()[0];
  
  // temporary array of radio button lists, read from cell 2C to the last non-empty column
  var radioOptions = sheet2.getRange(2, 2, 1, sheet2.getLastColumn() - 1).getValues()[0];

  // demographicOptions: 2D array of the radio buttons for each demographic question
  var demographicOptions = radioOptions.map(function(cell) {
    // get radio options from slash-separated list
    if (cell) { 
      return cell.split("/");
    }
    else {
      // a demogrpahic question without any buttons will not be displayed
      return null;
    }
  })


  // set the active sheet back to Sheet1 (at sheet index 0)
  book.setActiveSheet(book.getSheets()[0]);

  return {questions: questions, labelOptions: labelOptions, demographicQuestions: demographicQuestions, demographicOptions: demographicOptions};
}



/**
 * Submits a user's peer review responses and demographic data into two separate sheets
 * (Sheet1 and Sheet2) within the active Google Spreadsheet.
 * 
 * This function processes two sheets:
 *    - Sheet1: Each response is stored on a new row with a unique subject ID in column B.
 *        - The first column (A) is ignored and left blank.
 *    - Sheet2: Stores demographic responses, one entry per subject ID.
 *        - No placeholder column is required (column A stores subject ID).
 * 
 * Retrieves the last subject ID from column B of Sheet1.
 * If it's the column header ("SUBJECT ID"), starts from 1.
 * Appends each survey response with the subject ID and a blank first column.
 * Appends the demographic data with the same subject ID to Sheet2.
 * 
 * @param {Array<Array<any>>} responses - A 2D array where each sub-array represents one survey response
 * @param {Array<any>} demographicData - A flat array representing one set of demographic responses
 */
function submitResponses(responses, demographicData) {

  const book = SpreadsheetApp.getActiveSpreadsheet();

  // Sheet1 is the active sheet by default
  const sheet = book.getActiveSheet();


  // Sheet1 Process
  // get the last ID value from last non-empty row in the SUBJECT ID column (column B)
  var lastID = sheet.getRange(sheet.getLastRow(), 2).getValue(); 

  // subjectID: increment the value of the lastID,
  // unless the value of lastID is the "SUBJECT ID" column header, then set subjectID to 1
  const subjectID = ((lastID == "SUBJECT ID") ? 1 : (lastID + 1));
  
  // batch process the response(s)
  responses.forEach((response) => {
    // ignore the first column by adding an empty placeholder and subject ID at the start
    const adjustedResponses = ['',subjectID].concat(response);

    // insert response to the next empty row in Sheet1
    sheet.appendRow(adjustedResponses);
  });


  // Sheet2 Process
  // set the active sheet to Sheet2 (at sheet index 1)
  book.setActiveSheet(book.getSheets()[1]);

  // get Sheet2 to store the demographic form responses
  var sheet2 = book.getActiveSheet();

  // only need to process 1 response per subject ID
  const adjustedDemographicData = [subjectID].concat(demographicData);
  // unlike the survey responses, the dempgraphic adjusted repsonse does not need a an empty placeholder at the start,
  // Sheet2 is structured differently from Sheet1 (which has an extra column for survey parameters)

  sheet2.appendRow(adjustedDemographicData);
}



/**
 * Retrieves the HTML content from a file in the Apps Script project's file system.
 * 
 * This function modularizes HTML templates by including shared code 
 * (e.g., headers, footers, styles, or scripts) into a main HTML file.
 * 
 * Example usage inside an HTML template: 
 *    <?!= include('Styles'); ?>
 * 
 * @param {string} filename - The name of the HTML file to include (without file extension)
 * @returns {string} The raw HTML content of the specified file
 */
function include(filename) {

  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
