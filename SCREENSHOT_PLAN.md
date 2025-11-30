# Screenshot Plan for SmartLife Tracker Project Report

## Screenshot Specifications

### fig4_1_home.png
**Caption:** Dashboard overview showing personalized welcome message, stat cards for tasks, habits, expenses, and health, along with interactive charts displaying weekly trends.

**Capture Instructions:** 
- Browser window: 1920x1080 resolution
- Navigate to Dashboard after logging in
- Ensure all four stat cards are visible (Due Today, Habits, Spent This Week, Health Score)
- Show at least two charts (Expenses and Category Breakdown)
- Include the "Smart Insights" panel on the right
- Capture full viewport without scrolling

---

### fig4_2_tasks.png
**Caption:** Tasks page displaying task creation form, task list with priorities (High/Medium/Low), deadlines, and action buttons for edit, delete, and completion.

**Capture Instructions:**
- Browser window: 1920x1080 resolution
- Navigate to Tasks page (/tasks)
- Show the task creation form at the top
- Display at least 3-4 tasks in the list with different priorities (use color coding: red for High, yellow for Medium, green for Low)
- Ensure task cards show: title, priority badge, deadline, reminder time
- Include action buttons (checkmark, edit, delete) on each task
- Capture full page view

---

### fig4_3_habits.png
**Caption:** Habit tracker interface showing 7-day progress bar chart, current streak counter, today's minutes vs goal, and time logging button.

**Capture Instructions:**
- Browser window: 1920x1080 resolution
- Navigate to Tasks page (/tasks)
- Find a habit card (marked with "• Habit" label)
- Expand the habit section to show:
  - The bar chart showing last 7 days progress
  - "Today's minutes: X / Y min" display
  - "Streak: N days" counter
  - Action buttons: "Log minutes", "Postpone", "Mark Missed"
- Ensure the chart is fully visible and readable
- Capture the expanded habit card with all details

---

### fig4_4_expenses_limit.png
**Caption:** Expenses page with spending limit section expanded, showing weekly and monthly budget cards with visual warning indicators when limits are exceeded.

**Capture Instructions:**
- Browser window: 1920x1080 resolution
- Navigate to Expenses page (/expenses)
- Click to expand "Set Spending Limit" section
- Set a weekly limit (e.g., 1000) and monthly limit (e.g., 5000)
- Add expenses that exceed one of the limits
- Capture the budget overview cards showing:
  - Weekly Budget card with red border (if exceeded) or green (if within limit)
  - Monthly Budget card with red border (if exceeded) or purple (if within limit)
  - Warning message "⚠️ You have exceeded your spending limit" if applicable
- Show the limit input fields and "Save Limits" button
- Capture the full section including both cards

---

### fig4_5_history.png
**Caption:** Health tracking page displaying past entries in chronological order with date, water intake, sleep hours, step count, and edit/delete options.

**Capture Instructions:**
- Browser window: 1920x1080 resolution
- Navigate to Health page (/health)
- Scroll down to "Past Entries" section
- Ensure at least 4-5 historical entries are visible
- Each entry should show:
  - Date (formatted as "DD MMM YYYY")
  - Water intake (cups and ml)
  - Sleep hours
  - Step count
  - Edit and Delete buttons
- Entries should be sorted with most recent first
- Capture the full history section

---

### fig4_6_health.png
**Caption:** Health tracking interface showing today's health score as a doughnut chart, quick add form for water/sleep/steps, and weekly progress bar chart.

**Capture Instructions:**
- Browser window: 1920x1080 resolution
- Navigate to Health page (/health)
- Capture the top section showing:
  - "Today's Score" with percentage (e.g., "85%")
  - Doughnut chart visualization
  - Today's metrics: water, sleep, steps
- Show the "Quick Add" form with three input fields (Water, Sleep, Steps) and Save button
- Include the "Weekly Progress (% of Goal)" bar chart showing water, sleep, and steps percentages
- Ensure all three elements are visible in one screenshot
- Capture full viewport

---

### fig4_7_admin.png
**Caption:** [NOT IMPLEMENTED] Admin panel is not part of the current project scope. The application focuses on individual user account management through the Profile page.

**Capture Instructions:** 
- **ALTERNATIVE:** Show Profile page instead
- Browser window: 1920x1080 resolution
- Navigate to Profile page (/profile)
- Show the profile card with:
  - User avatar/icon
  - Name, Age, Email fields
  - "Edit Profile" button
  - "Change Password" section (collapsed or expanded)
- This demonstrates user account management capabilities
- **Note in report:** Admin panel feature is not implemented as it was outside the project scope. Individual user management is available through the Profile page.

---

### fig4_8_api_postman.png
**Caption:** Postman API testing interface demonstrating GET request to /tasks endpoint with userId query parameter, showing successful response with task data in JSON format.

**Capture Instructions:**
- Postman window: 1920x1080 resolution
- Open Postman application
- Create a new GET request
- URL: `http://localhost:5000/tasks?userId=1`
- Click Send
- Capture the interface showing:
  - Request method (GET) and URL in address bar
  - Params tab showing userId=1
  - Response section showing:
    - Status: 200 OK
    - Response time
    - JSON body with array of task objects
  - Ensure at least 2-3 task objects are visible in the response
- Include Postman's interface elements (tabs, headers, etc.)

**Alternative (cURL):**
- Terminal window: 1920x1080 resolution
- Run: `curl -X GET "http://localhost:5000/tasks?userId=1"`
- Capture terminal showing the command and JSON response

---

### fig4_9_project_structure.png
**Caption:** Visual Studio Code file explorer showing complete project directory structure including src folder with api, components, context, pages subdirectories, and key configuration files.

**Capture Instructions:**
- VS Code window: 1920x1080 resolution
- Open the project in Visual Studio Code
- In the Explorer sidebar, expand the project root folder
- Show the complete structure:
  - Root level: `db.json`, `package.json`, `vite.config.js`, `tailwind.config.js`, etc.
  - `src/` folder expanded showing:
    - `api/` folder with all 6 API files
    - `components/` folder with Navbar.jsx and DashboardCharts.jsx
    - `context/` folder with AuthContext.jsx
    - `pages/` folder with all 7 page files
    - `assets/` folder
    - `App.jsx`, `main.jsx`, `index.css`
- Ensure file icons and folder structure are clearly visible
- Capture the full Explorer panel

**Alternative (File Explorer):**
- Windows File Explorer: 1920x1080 resolution
- Navigate to project directory
- Use tree view or expand all folders
- Capture showing the same structure as above

---

## Screenshot Quality Guidelines

1. **Resolution:** All screenshots should be captured at 1920x1080 resolution or higher
2. **Format:** Save as PNG format for best quality
3. **Naming:** Use exact filenames as specified (fig4_1_home.png, etc.)
4. **Clarity:** Ensure text is readable, UI elements are clear
5. **Consistency:** Use same browser/theme (dark mode recommended for consistency)
6. **Annotations:** If needed, add subtle arrows or highlights (but keep minimal)
7. **File Size:** Optimize images if file size exceeds 2MB per image

---

## Screenshot Checklist

- [ ] fig4_1_home.png - Dashboard overview
- [ ] fig4_2_tasks.png - Tasks page
- [ ] fig4_3_habits.png - Habit tracker with chart
- [ ] fig4_4_expenses_limit.png - Expenses with limits
- [ ] fig4_5_history.png - Health history
- [ ] fig4_6_health.png - Health interface
- [ ] fig4_7_admin.png - Profile page (admin alternative)
- [ ] fig4_8_api_postman.png - API testing
- [ ] fig4_9_project_structure.png - File structure

---

## Notes

- All screenshots should be taken with the application running locally
- Ensure JSON-Server is running on port 5000
- Use test data that demonstrates features clearly
- For consistency, use the same user account across all screenshots
- Dark mode is recommended for a professional look
- Remove any sensitive data (real emails, passwords) before final submission

