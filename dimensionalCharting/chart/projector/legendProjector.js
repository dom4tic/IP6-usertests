import { dom } from "../../../kolibri/util/dom.js";
import { hideTooltip } from "../../util/chartUtil.js";

export { LegendProjector }

const ATTRIBUTE_PARTITION_KEY = "data-partition-key";

/**
 * Constructor for a chart legend.
 * @param { LegendProjectorDataType } parameterObject
 * @return { HTMLDivElement }
 * @constructor
 */
const LegendProjector = ({
     chartController,
     hotspotController,
     selectionController,
     labelAccessor = p => p.getKey()
 }) => {
    const legendContainer = document.createElement("div");

    chartController.onPartitionsChanged(    _ => draw(legendContainer, chartController, hotspotController, selectionController, labelAccessor));
    selectionController.onSelectionChanged( _ => draw(legendContainer, chartController, hotspotController, selectionController, labelAccessor));
    hotspotController.onHotspotChanged(partition => changeHotspotHover(partition, legendContainer));

    return legendContainer;
};

/**
 *
 * @param { HTMLDivElement } root
 * @param { ChartControllerType } chartController
 * @param { HotspotControllerType } hotspotController
 * @param { MultiSelectionControllerType } selectionController
 * @param { (p: IPartition) => string } labelAccessor
 */
const draw = (root, chartController, hotspotController, selectionController, labelAccessor) => {
    cleanup(root);

    const [css] = dom(`   
        <style>              
            .legend-item-vertical {
                display:     flex;
                align-items: center;
                cursor:      pointer;
                margin-top:  .4em;
            }
    
            .legend-item-vertical .legend-item-color {
                display:       inline-block;
                width:         1em;
                height:        1em;
                border-radius: .2em;
                transition:    width var(--animation-duration) ease, height var(--animation-duration) ease;
            }
    
            .legend-item-vertical .legend-item-label {
                font-family: Work-Sans, system-ui;
                font-weight: var(--font-weight);
                font-size:   var(--font-header-size);
                color:       var(--font-color);
                
                display:        inline-block;
                padding-left:   .3em;
            }
            
            .hotspot .legend-item-label {                
                font-weight: var(--font-header-weight);
                transition:  font-weight var(--animation-duration) ease;
            }
    
            .hotspot .legend-item-color {
                width:         1.05em;
                height:        1.05em;
            }
            
            .selected .legend-item-label {
                font-weight: var(--font-weight-bold);
            }
            
            .selected .legend-item-color {
                width:         1.1em;
                height:        1.1em;
            }
            
            .legend-item-vertical:nth-child(11n+1)  .legend-item-color { background-color: var(--color0); }
            .legend-item-vertical:nth-child(11n+2)  .legend-item-color { background-color: var(--color1); }
            .legend-item-vertical:nth-child(11n+3)  .legend-item-color { background-color: var(--color2); }
            .legend-item-vertical:nth-child(11n+4)  .legend-item-color { background-color: var(--color3); }
            .legend-item-vertical:nth-child(11n+5)  .legend-item-color { background-color: var(--color4); }
            .legend-item-vertical:nth-child(11n+6)  .legend-item-color { background-color: var(--color5); }
            .legend-item-vertical:nth-child(11n+7)  .legend-item-color { background-color: var(--color6); }
            .legend-item-vertical:nth-child(11n+8)  .legend-item-color { background-color: var(--color7); }
            .legend-item-vertical:nth-child(11n+9)  .legend-item-color { background-color: var(--color8); }
            .legend-item-vertical:nth-child(11n+10) .legend-item-color { background-color: var(--color9); }
            .legend-item-vertical:nth-child(11n+11) .legend-item-color { background-color: var(--color10); }            
        </style>
    `);


    let columnCount = 0;
    let itemCount = 0;

    chartController.getPartitions().forEach(partition => {
        const isSelected = selectionController.isSelected(partition);
        const isHovered = hotspotController.getHotspot()?.getKey() === partition.getKey();
        const legendElement = buildPartitionElement(partition.getKey(), labelAccessor(partition), isSelected, isHovered);

        legendElement.addEventListener('click', () => {
            if (selectionController.isSelected(partition)) {
                // same, undo selection filter
                selectionController.unselect(partition);
            } else {
                selectionController.select(partition);
            }
        });

        legendElement.addEventListener('mousemove', () => {
            // check if is hovering over the element
            if (hotspotController.getHotspot()?.getKey() !== partition.getKey()) {
                hotspotController.setHotspot(partition);
            }
        });

        legendElement.addEventListener('mouseleave', () => {
            hotspotController.setHotspot(undefined);
        });


        if (itemCount === 11) {
            columnCount++;
            itemCount = 0;
        }

        if (columnCount >= 0) {
            let column = root.querySelector(`.column-${columnCount}`);
            if (!column) {
                column = document.createElement('div');
                column.classList.add('legend-column');
                column.classList.add(`column-${columnCount}`);
                root.appendChild(column);
            }
            column.appendChild(legendElement);
        } else {
            root.appendChild(legendElement);
        }

        root.appendChild(css);
        itemCount++;
    });

    return root;
};

const cleanup = root => {
    while (root.firstChild) {
        root.removeChild(root.firstChild);
    }
};

const buildPartitionElement = (partitionKey, label, isSelected, isHovered) => {
    const div = document.createElement("div");
    div.setAttribute(ATTRIBUTE_PARTITION_KEY, partitionKey);
    div.classList.add("legend-item-vertical");
    if (isHovered)  div.classList.add("hotspot");
    if (isSelected) div.classList.add("selected");

    const colorIndex = document.createElement("span");
    colorIndex.classList.add("legend-item-color");

    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    labelElement.classList.add("legend-item-label");

    div.append(colorIndex, labelElement);

    return div;
};

/**
 * Add the hover class to the element at the hover index
 * @param { IPartition } partition
 * @param { Element } root
 * @return { void }
 */
const changeHotspotHover = (partition, root) => {
    // remove all faded classes
    root.querySelectorAll('.hotspot').forEach(element => element.classList.remove('hotspot'));

    // return if no hover
    if (partition === undefined) {
        hideTooltip();
        return;
    }

    // get the span element inside the group div
    const element = root.querySelector('div[' + ATTRIBUTE_PARTITION_KEY + '="' + partition.getKey() + '"]');
    element.classList.add('hotspot');
};
