# Qt widget demos (browser)

Two administration systems for the INF2611 question paper, one per scenario. Each has the four required pages
(**Login, then three working pages**), a calendar and a graphic logo. Everything on screen is a **Qt Designer widget**
redrawn in plain HTML, CSS and JavaScript, so the look is a desktop Qt (Fusion) window: title bar, menu bar,
status bar, message boxes. There are no libraries and no build step.

Hover any widget and the status bar shows its Qt class and object name (for example `QDial · dial`).

| | Scenario 1: Stonecroft Heritage Lettings | Scenario 2: Amper Motors |
|---|---|---|
| Business | Letting agency for restored heritage homes | Dealership for electric and hybrid vehicles |
| Palette | Light, shutter green | Dark, signal orange |
| Page 2 | QDoubleSpinBox, QComboBox, QTextEdit, **QCalendarWidget**, QListWidget | **QTabWidget**, QSpinBox, vertical and horizontal **QSlider**, QCheckBox, QPlainTextEdit, **QTextBrowser** (live spec sheet) |
| Page 3 | **QDateTimeEdit**, QSpinBox, QGroupBox with QRadioButtons and QCheckBoxes | **QCalendarWidget**, **QTimeEdit**, **QDateEdit**, **QTreeWidget** |
| Page 4 | **QDial**, **QLCDNumber** (x2, one is the live clock), **QProgressBar**, QTableWidget | **QGraphicsView** (analog clock and bar chart), **QScrollArea**, QTextBrowser, QTabWidget, QTableView |

Only the calendar appears in both, because the brief asks for one.

## Run it

Open `scenario1-stonecroft/index.html` or `scenario2-amper/index.html` in a browser. Keep the `shared/` folder next to them.

| Scenario | Demo login |
|---|---|
| 1 | `demo` / `heritage123` |
| 2 | `demo` / `amper123` |

Entries are saved in the browser's local storage. The login check runs in the browser, so it is a demo and not real security.

## Publish

Repository **Settings → Pages**, deploy from the `main` branch root. The two apps will be at `/scenario1-stonecroft/` and `/scenario2-amper/`.

## Structure

```
shared/qt.css      Fusion-style look for every widget (light and dark palette)
shared/qt.js       the widgets: QDial, QLCDNumber, QCalendarWidget, QDateTimeEdit, QSlider, QTreeWidget, QMessageBox ...
scenario1-stonecroft/  index.html, app.js
scenario2-amper/       index.html, app.js
```
