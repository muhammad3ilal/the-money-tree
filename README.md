# The Money Tree



#### Description:

The Money Tree is a personal finance tracker web application that helps users manage
their income, expenses, and budgets all in one place. The project is built using HTML,
CSS, and JavaScript, and runs entirely in the browser with no account, server, or API
key required. All data is saved locally using the browser's localStorage, so your
financial data stays on your device and persists between sessions.

I chose this project because managing personal finances is a real problem that affects
everyone, especially students. Most budgeting apps require accounts or subscriptions.
The Money Tree solves this by being completely free, private, and instant to use — just
open the file and start tracking.

The project has four main pages. The Dashboard is the home screen and shows four summary
cards displaying total income, total expenses, net balance, and savings rate. It also
shows a bar chart comparing income vs expenses over the last 6 months, a donut chart
breaking down spending by category, and a list of recent transactions. Everything on
the dashboard updates in real time whenever a transaction is added or deleted.

The Transactions page shows the full history of all transactions. There are three
filters at the top — filter by type (income or expense), by category, and by month —
which can be used together to find specific transactions quickly. Each transaction
can be deleted with the X button that appears on hover.

The Budget page lets the user set monthly spending limits for any expense category.
Each budget shows a progress bar that fills up as money is spent in that category
during the current month. The bar turns gold when spending reaches 75% of the limit
and turns red when the limit is exceeded, giving a clear visual warning.

The Reports page provides deeper financial insights including a line chart showing
the monthly spending trend over the last 6 months, a ranked list of top expense
categories with their totals, and a month-by-month net balance summary.

The project is split into three files. index.html contains all the structure of the
application including the sidebar navigation, all four pages, and the three modal
popups for adding transactions, setting budgets, and confirming data deletion.
css/style.css contains all the visual styling including the dark theme, layout using
CSS Grid and Flexbox, animations, progress bars, and responsive design for smaller
screens. js/app.js contains all the application logic including saving and loading
data with localStorage, calculating totals, rendering all four pages, building the
three Chart.js charts, and handling all user interactions.

One design decision I made was to use Chart.js loaded from a CDN rather than writing
charts from scratch. This kept the code clean and focused on the financial logic rather
than canvas drawing math. Another decision was to re-render the entire UI whenever
data changes rather than updating individual elements. This makes the code much simpler
and easier to follow since there is only one version of the truth at any time.

The hardest part of the project was making sure the charts updated correctly and did
not stack on top of each other when re-rendered. The fix was to destroy the existing
chart instance before creating a new one, which is handled by storing each chart in a
variable and calling .destroy() if it already exists.

