# User Guide

A web app for building a dental hygiene care plan in an intuitive way and generating it into a Word document.

## Layout

The app is a single screen with three panes:

- **Command bar** (left): controls for a new plan, data import/export, document generation and configuration.
- **Case study** (middle): always visible, no matter which part of the plan you're working on.
- **Care plan** (right): the care plan form itself, organized into collapsible sections.

## Case study

Paste the patient case text into the case study pane. Highlight parts of it as you work, if needed. It stays pinned 
on screen as you scroll and expand sections on the plan side, so you can keep referring back to it while filling out 
needs, goals, assessments etc.

## Filling out the plan

Sections expand/collapse independently:

- **Patient**: initials, chart ID, date of birth.
- **Subjective data**: chief complaint, social background, dental and medical history summary.
- **Objective data**: vitals, exam findings, restorative/periodontal assessment, recorded medical history.
- **Medical conditions**: a list of conditions and their respective medications, adverse effects and plan modifications.
- **Human needs**: the 8 standard needs, plus 1 specific to Tunxis Dental Hygiene program. This is one of the key 
  benefits of using the tool as a typical care plan document represents each need across several separate sections 
  (e.g. assessment, prioritization, planning). Here you enter each need once, and the tool spreads its parts into those 
  sections when generating the document.
- **Appointments**: list of planned visits, recommended care interval.

Each section header shows a quick summary (e.g. how many needs are assessed vs. marked as present), so you can see 
progress without expanding everything.

### Priority warnings

If two needs share the same priority number, or priorities skip a number, you'll see a warning icon on the Priority 
field. This is just a nudge to keep priorities clean and sequential, it won't block you from generating the plan.

## Calculators

- **BMI**: next to the BMI field in _Objective data → Medical history_. Enter weight and height, and accept the result 
  to fill the field automatically. It generates the value and assigns a standard classification.
- **Age**: next to date of birth in the _Patient_ section. This is a read-only value, it recalculates live from the DOB 
  as a quick reference for you, but the age itself isn't included in the generated document.

## Generating the document

Click **Generate plan**, choose a `.docx` template, and the app fills it in and downloads the result. If the template 
has issues (e.g. unrecognized tags) or the plan is missing something the template needs, you'll get a list of the 
specific problems instead of a broken file.

**IMPORTANT**: this is a _one-way_ process. The tool writes data into the Word document, but it never reads from it 
back. Any edits you make directly in the generated `.docx` stay only in that file, there's no way to bring them back 
into the tool except making the same edits.

You can learn more about how templates work in the [template guide](./TEMPLATE.md).

## Data import / export

- **Export data**: saves your current plan into a file, useful for backups or moving to another machine.
- **Import data**: loads a plan from a file, replacing what's currently open (you'll be asked to confirm).

## Saving your work

No data is sent anywhere outside of your computer. Everything is saved automatically to your browser's local storage 
a second or so after each edit, and it's still there next time you open the app, even after closing the browser or 
restarting your computer. It only goes away if you clear your browser's site data or use **New plan** function.

In a case when the local storage isn't available (e.g. private browsing in some browsers), you'll see a "not saving" 
indicator at the bottom of the command bar, next to the app version. Your work stays in memory for that session only, 
so export it before closing the tab.

## Configuration

**Configure** in the command bar opens the formatting and labels used for plan generation, e.g date/time formats or the 
text used in the document for each need. Use it, if you want different wording or formats in your plan document.

You can always revert back to the original original built-in configuration using **Reset to defaults**.

As with the data, the configuration could be exported and imported using the button at the bottom of its dialog.
