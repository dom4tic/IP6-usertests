import { dom } from "../../../kolibri/util/dom.js";

export { TableProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

let counter = 0;

/**
 * @typedef ColumnSpec
 * @property { string } label
 * @property { (a: *) => * } format
 *
 */

/**
 * Constructor for a {@link ChartProjectorType Chart}.
 * @param { TableProjectorDataType } parameterObject
 * @return { HTMLDivElement }
 * @constructor
 */
const TableProjector = ({
    chartController,
    selectionController,
    hotspotController,
    columns
}) => {
    const styleId = counter++;

    const [css] = dom(`
        <style>
            .table-container-${ styleId } {
                overflow-y:    auto;
                height:        inherit;
                border-radius: .5em .5em 0 0;
            
                table {
                    border-collapse: separate;
                    width:           100%;
                    user-select:     none;
                    
                    -webkit-border-horizontal-spacing: 0;
                    -webkit-border-vertical-spacing:   0;
                }
                
                table tbody > tr {
                    opacity:   0;
                    animation: growWave var(--animation-duration) forwards;
                }

                thead {
                    position: sticky;
                    top:      0;
                    cursor:   pointer;
                    z-index:  2;
                }
            
                th {       
                    border-top:    1px solid var(--grey90);
                    border-bottom: 1px solid var(--grey90);
               
                    padding:          .8em;
                    text-align:       left;
                    vertical-align:   top;
                    background-color: var(--grey90);
                    
                    font-family: var(--font-header-family), system-ui;
                    font-weight: var(--font-header-weight);
                    font-size:   var(--font-header-size);
                    color:       var(--font-header-color);
                }
                
                th.sorted {
                    font-weight: var(--font-weight-bold);
                }
                            
                td {
                    border-bottom: 1px solid var(--grey90);
                    padding:       .7em;
                    white-space:   nowrap;
                    z-index:       1;
                    
                    font-family: var(--font-table-family), system-ui;
                    font-weight: var(--font-weight);
                    font-size:   var(--font-size);
                    color:       var(--font-color);
                }
                
                table th:first-child,
                table td:first-child {
                  /* Apply a left border on the first <td> or <th> in a row */
                  border-left:  1px solid var(--grey90);
                }
                
                table th:last-child,
                table td:last-child {
                  /* Apply a right border on the last <td> or <th> in a row */
                  border-right:  1px solid var(--grey90);
                }

                td.numeric, th.numeric {
                    text-align:   right;
                    font-variant: tabular-nums;
                }
                
                .row-hover {
                    background-color: var(--grey98);
                    transition:       background-color .3s ease;
                }
                
                .row-selected {
                    background-color: var(--color5);
                }
                
                .sort-icon {
                    display:      inline-block;
                    width:        1em;
                    padding-left: .5em;
                    text-align:   center;
                    font-size:    .8em;
                    font-weight:  var(--font-weight-light);
                }
                
                .sort-icon.active {
                    font-weight:  var(--font-weight-bold);
                }
            }
            
            @keyframes growWave {
                0% {
                    opacity: 0;
                }
                50% {
                    opacity: 1;
                    transform: translateY(0) scale(1.1);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

        </style>
    `);

    const scrollContainer = document.createElement("div");
    const table         = document.createElement("table");

    scrollContainer.classList.add(`table-container-${ styleId }`);
    scrollContainer.appendChild(table);

    scrollContainer.appendChild(css);

    const render = () => {
        scrollContainer.scrollTop = 0;
        drawTable(chartController, hotspotController, selectionController, table, columns);
    };
    chartController.onPartitionsChanged(_ => render());
    selectionController.onSelectionChanged(_ => changeSelection(table, selectionController));
    hotspotController.onHotspotChanged(partition => changeHotspotHover(table, partition));

    return scrollContainer;
};

/**
 * @template _T_
 * @param { ChartControllerType }          tableController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 * @param { HTMLElement }                  root
 * @param { {label: String, format: ((a: *) => *)}[] } columns
 */
const drawTable = (tableController, hotspotController, selectionController, root, columns) => {
    const partitions = tableController.getPartitions();
    const data = partitions.map(p => p.getValue());
    root.innerHTML = "";

    if (data.length !== 0) {
        const [thead, tbody] = createHeaderAndBody(
            columns.map(c => c.format),
            columns.map(c => c.label),
            tableController,
            hotspotController,
            selectionController
        );

        root.appendChild(thead);
        root.appendChild(tbody);
    }
};

/**
 * Create a table body with the given headers
 * @param { Array<(value: *) => *> }   valuesAccessors
 * @param headers
 * @param { ChartControllerType }          tableController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 *
 * @return { [HTMLTableSectionElement, HTMLTableSectionElement] }
 */
const createHeaderAndBody = (valuesAccessors, headers, tableController, hotspotController, selectionController) => {
    const partitions = tableController.getPartitions();

    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const headerRow = document.createElement("tr");

    partitions.forEach((partition, index) => {
        const isSelected = selectionController.isSelected(partition);
        const row = document.createElement("tr");
        row.setAttribute(ATTRIBUTE_PARTITION_KEY, partition.getKey());
        row.style.animationDelay = `${ 0.01 * (index + 1) }s`;

        // TODO: improve this
        valuesAccessors.forEach((accessor, index) => {
            const td = document.createElement("td");
            const value = accessor(partition.getValue());
            const text = headers[index];

            // add the th if needed
            if (partition === partitions[0]) {
                const th = document.createElement("th");
                th.innerHTML = text + `<span class="sort-icon">↓↑</span>`;
                addHeaderEventListener(th);
                if (typeof value === "number") {
                    th.classList.add("numeric");
                }
                headerRow.appendChild(th);
            }

            if (typeof value === "number") {
                td.classList.add("numeric");
                td.textContent = value.toLocaleString("de-CH");
            } else {
                td.textContent = value;
            }


            row.appendChild(td);
        });

        if (isSelected) {
            row.classList.add("row-selected");
        }

        addEventListeners(row, tbody, tableController, hotspotController, selectionController);

        thead.appendChild(headerRow);
        tbody.appendChild(row);
    });

    return [thead, tbody];
};


/**
 * Add event listeners to the table header
 * @param { HTMLElement } tHead
 */
const addHeaderEventListener = tHead => {
    tHead.addEventListener('click', () => {
        const table = tHead.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const index  = Array.from(tHead.parentElement.children).indexOf(tHead);
        const currentSort = tHead.getAttribute('data-sort');

        table.querySelectorAll('.sort-icon').forEach(icon => {
            icon.classList.remove('active');
            icon.innerText = "↓↑";
        });
        table.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));

        rows.sort((a, b) => {
            let [cellA, cellB] = [a.children[index].innerText, b.children[index].innerText];

            if (!isNaN(cellA) && !isNaN(cellB)) {
                [cellA, cellB] = [parseFloat(cellA), parseFloat(cellB)];
            }
            return (currentSort === 'asc') ? (cellA > cellB ? 1 : -1) : (cellA < cellB ? 1 : -1);
        });

        tbody.innerHTML = '';
        rows.forEach((row, index) => {
            row.style.animationDelay = `${ 0.01 * (index + 1) }s`;
            tbody.appendChild(row)
        });

        // add the class sorted to the sorted th
        tHead.classList.add('sorted');

        const newSort = currentSort === 'asc' ? 'desc' : 'asc';
        const sortIcon = tHead.querySelector('.sort-icon');
        sortIcon.innerText = newSort === 'asc' ? '↑' : '↓';
        sortIcon.classList.add('active');
        tHead.setAttribute('data-sort', newSort);
    });
};

/**
 * Add the selection class to the row for all the selected elements
 * @param { Element }    table
 * @param { MultiSelectionControllerType } selectionController
 *
 * @return { void }
 */
const changeSelection = (table, selectionController) => {
    const rows = Array.from(table.getElementsByTagName("tr"));
    rows.forEach(row => row.classList.remove("row-selected"));

    if (selectionController.getSelection().length === 0) return;

    selectionController.getSelection().forEach(partition => {
        const row = table.querySelector(`tr[${ATTRIBUTE_PARTITION_KEY}="${partition.getKey()}"]`);
        row.classList.add("row-selected");
    });
};


/**
 * Add the hover class to the row at the hover index
 * @param { Element }    table
 * @param { IPartition } partition
 *
 * @return { void }
 */
const changeHotspotHover = (table, partition) => {
    const rows = Array.from(table.getElementsByTagName("tr"));
    rows.forEach(row => row.classList.remove("row-hover"));

    if (partition === undefined) return;

    const row = table.querySelector(`tr[${ ATTRIBUTE_PARTITION_KEY }="${ partition.getKey() }"]`);
    row.classList.add("row-hover");
};

/**
 * Add event listeners to the table body
 * @param { HTMLElement }                  row
 * @param { HTMLElement }                  tBody
 * @param { ChartControllerType }          chartController
 * @param { HotspotControllerType }        hotspotController
 * @param { MultiSelectionControllerType } selectionController
 *
 * @return { void }
 */
const addEventListeners = (row, tBody, chartController, hotspotController, selectionController) => {
    const partitionKey = row.getAttribute(ATTRIBUTE_PARTITION_KEY);
    const partition = chartController.find(partitionKey);

    row.addEventListener("click", e => {
        const index = getIndexOfRow(row, tBody);

        if (partition === undefined) return;

        const lastSelectedIndex = getLastSelectedIndex(chartController, selectionController);

        if (e.shiftKey && lastSelectedIndex >= 0) {
            // shift click selection
            selectionController.clearSelection();

            const startIndex = Math.min(lastSelectedIndex, index);
            const endIndex   = Math.max(lastSelectedIndex, index);

            for (let i = startIndex; i <= endIndex; i++) {
                const rowPartition = chartController.getPartitions()[i];
                if (!selectionController.isSelected(rowPartition)) {
                    selectionController.select(rowPartition);
                }
            }
        } else {
            // normal selection
            if (selectionController.isSelected(partition)) {
                selectionController.unselect(partition);
            } else {
                selectionController.select(partition);
            }
        }
    });

    row.addEventListener("mousemove", () => {
        if (hotspotController.getHotspot()?.getKey() !== partitionKey) {
            hotspotController.setHotspot(partition);
        }
    });

    row.addEventListener("mouseleave", () => hotspotController.setHotspot(undefined));

    row.addEventListener("dblclick", () => selectionController.clearSelection());
};

/**
 * Get the index of the last selected partition
 * @param { ChartControllerType }          chartController
 * @param { MultiSelectionControllerType } selectionController
 *
 * @return { number }
 */
const getLastSelectedIndex = (chartController, selectionController) => {
    const selections              = selectionController.getSelection();
    const lastSelection = selections[selections.length - 1];
    return lastSelection ? chartController.getPartitions().findIndex(p => p.getKey() === lastSelection.getKey()) : -1;
};

/**
 * Returns the index of the row in the given table body
 * @param { HTMLElement } row
 * @param { HTMLElement } tBody
 *
 * @return { number }
 */
const getIndexOfRow = (row, tBody) => Array.from(tBody.querySelectorAll("tr")).indexOf(row);
