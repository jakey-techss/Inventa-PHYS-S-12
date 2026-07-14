let activeNode;
class node {
    constructor(name, inputValues, outputValues, description, blockCategory) {
        this.name = name
        this.inputValues = inputValues
        this.outputValues = outputValues
        this.description = description
        this.blockCategory = blockCategory
    }
}
const nodeLibrary = [
    new node("Create Classification Model",
        [
            { input: "Data Column", category: "data", acceptedTypes: ["DataColumn", " Variable&lt;List&gt;"], description: "The data column that will be passed into the AI model for classification." },
            { input: "Categories", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The possible categories it can be sorted into." },
            { input: "Condition", category: "condition", acceptedTypes: ["Condition"], description: "The condition created by the condition builder block." },
        ],
        [
            { output: "AI Model", category: "ai", outputType: "AI Model", description: "An AI Model that can be used to predict outcomes using data" },
        ],
        "Create a classification model that can classify any input into given categories by using the categories variable and condition. This can be used in 'Predict' node to get output from the model",
        "ai"
    )
]
document.addEventListener("DOMContentLoaded", () => {
    log("Connecting To Hub", "process");
    connectToHub();
    setupSidebarDrag();
});
let initialScale = 1
document.querySelectorAll('.sidebar-group-toggle').forEach(toggle => {
    const group = toggle.closest('.collapsible-group');
    group.classList.toggle('is-collapsed');

    toggle.addEventListener('click', () => {
        group.classList.toggle('is-collapsed');
    });
});

const HUB_URL = "ws://inventa-hub.local/ws";
let socket;

function connectToHub() {
    socket = new WebSocket(HUB_URL);

    socket.onerror = () => {
        log("Hub failed to connect", "error");
        document.querySelector(".status-dot-hub").style.backgroundColor = "#FF4D4D";
        document.getElementById("hubStatus").innerHTML = `Hub Connection Failed`;
    };

    socket.onopen = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#34D399";
        document.getElementById("hubStatus").innerHTML = `Hub Ready`;
        log("Hub Connected", "success");
    };
}
function setupSidebarDrag() {
    const sidebarBlocks = document.querySelectorAll(".ai-model-sidebar-block");
    const canvas = document.getElementById("codingCanvas");

    sidebarBlocks.forEach(block => {
        block.addEventListener("click", (e) => {
            document.getElementById("block-info-bar").style.display = "flex"
        })
        let universalConnector = document.createElement("div")
        universalConnector.classList.add('ai-mini-port-row')
        universalConnector.innerHTML = `
        <span class="ai-mini-port-dot any"></span>
        <span class="ai-mini-port-label">Universal Connector</span>
        `                 

        block.children[0].children[0].appendChild(universalConnector)
        block.addEventListener("mousedown", (e) => {
             

            const clone = block.cloneNode(true);
            clone.classList.add("canvas-block");
            clone.style.position = "absolute";
            clone.style.pointerEvents = "none"; // while dragging
            clone.style.zIndex = "20";

            document.body.appendChild(clone);

            attachNodeContextMenu(clone)

            const rect = block.getBoundingClientRect();
            const shiftX = e.clientX - rect.left;
            const shiftY = e.clientY - rect.top;

            clone.style.width = rect.width + "px";
            clone.style.left = rect.left + "px";
            clone.style.top = rect.top + "px";

            function moveAt(pageX, pageY) {
                clone.style.left = pageX - shiftX + "px";
                clone.style.top = pageY - shiftY + "px";
            }

            moveAt(e.pageX, e.pageY);

            function onMouseMove(ev) {
                moveAt(ev.pageX, ev.pageY);
            }

            document.addEventListener("mousemove", onMouseMove);

            document.addEventListener("mouseup", function onMouseUp(ev) {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);

                const canvasRect = canvas.getBoundingClientRect();

                const isInsideCanvas =
                    ev.clientX >= canvasRect.left &&
                    ev.clientX <= canvasRect.right &&
                    ev.clientY >= canvasRect.top &&
                    ev.clientY <= canvasRect.bottom;

                if (isInsideCanvas) {
                    // convert from page position to canvas-local position
                    const x = ev.clientX - canvasRect.left - shiftX;
                    const y = ev.clientY - canvasRect.top - shiftY;

                    canvas.appendChild(clone);
                    clone.style.pointerEvents = "auto";
                    clone.style.zIndex = "20";
                    clone.style.left = `${x}px`;
                    clone.style.top = `${y}px`;

                    makeCanvasBlockDraggable(clone, canvas);
                } else {
                    clone.remove();
                }
            });
        });
    });
}

function makeCanvasBlockDraggable(block, canvas) {
    let pos3 = 0, pos4 = 0, pos1 = 0, pos2 = 0;

    block.onmousedown = dragMouseDown;

    function dragMouseDown(e) {

        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {


        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        let newTop = block.offsetTop - pos2;
        let newLeft = block.offsetLeft - pos1;

        // optional: keep inside canvas bounds
        const maxLeft = canvas.clientWidth - block.offsetWidth;
        const maxTop = canvas.clientHeight - block.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        block.style.top = newTop + "px";
        block.style.left = newLeft + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

const contextMenu = document.getElementById("node-context-menu");
let contextTargetNode = null;

function attachNodeContextMenu(node) {
    node.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        contextTargetNode = node;
        openContextMenu(e.clientX, e.clientY);
    });
}
document.getElementById("Clear").addEventListener("click", () => {
    document.querySelectorAll("#codingCanvas .canvas-block").forEach((el) => {
        deleteNode(el)
    })
})
function openContextMenu(x, y) {
    contextMenu.classList.remove("hidden");

    requestAnimationFrame(() => {
        const menuRect = contextMenu.getBoundingClientRect();

        let posX = x;
        let posY = y;

        if (posX + menuRect.width > window.innerWidth - 10) {
            posX = window.innerWidth - menuRect.width - 10;
        }

        if (posY + menuRect.height > window.innerHeight - 10) {
            posY = window.innerHeight - menuRect.height - 10;
        }

        contextMenu.style.left = `${posX}px`;
        contextMenu.style.top = `${posY}px`;

        contextMenu.classList.add("show");
    });
}

function hideContextMenu() {
    contextMenu.classList.remove("show");

    setTimeout(() => {
        contextMenu.classList.add("hidden");
        contextTargetNode = null;
    }, 140);
}


contextMenu.addEventListener("click", (e) => {
    const button = e.target.closest(".context-menu-item");
    if (!button || !contextTargetNode) return;

    const action = button.dataset.action;

    if (action === "copy") {
        copyNode(contextTargetNode);
    }

    if (action === "delete") {
        deleteNode(contextTargetNode);
    }

    if (action === "node-docs") {
        openDocs(contextTargetNode);
    }

    hideContextMenu();
});
function openDocs(node) {
    
    document.querySelectorAll(".inspector-row").forEach((child)=>{
        try{
            document.querySelector(".inspector-section").removeChild(child)
        }catch{
            document.getElementById("outputHolder").removeChild(child)
        }
    })
    let nodeInfo = nodeLibrary.find((item) => {
        return item.name == node.lastElementChild.innerHTML
    })
    setTimeout(()=>{
        document.getElementById("Docsheader").innerHTML = `<div class="inspector-title ${nodeInfo.blockCategory}-text" id="Docsheader">
                                <span class="group-dot ${nodeInfo.blockCategory}-bg"></span>
                                <span>${nodeInfo.name}</span>
                            </div>`
    document.getElementById("nodeDes").innerHTML = nodeInfo.description
    let inputContainer = document.querySelector(".inspector-section")
    let outputContainer = document.getElementById("outputHolder")
    
    nodeInfo.inputValues.forEach((input) => {
        let inputBox = document.createElement("div")
        inputBox.classList.add("inspector-row")
        inputBox.innerHTML = `
            <div class="inspector-label ${input.category}-text">
                                <span class="mini-dot ${input.category}-bg"></span>
                                ${input.input}
                            </div>
                            <p>${input.description}<br><span style='font-family:"JetBrains Mono"; font-size:12px; color:var(--${input.category});'>Accepted Data Types: ${input.acceptedTypes}</span></p>
        `
        inputContainer.appendChild(inputBox)
    })

    nodeInfo.outputValues.forEach((output) => {
        let inputBox = document.createElement("div")
        inputBox.classList.add("inspector-row")
        inputBox.innerHTML = `
            <div class="inspector-label ${output.category}-text">
                                <span class="mini-dot ${output.category}-bg"></span>
                                ${output.output}
                            </div>
                            <p>${output.description}<br><span style='font-family:"JetBrains Mono"; font-size:12px; color:var(--${output.category});'>Output Data Type: ${output.outputType}</span></p>
        `
        outputContainer.appendChild(inputBox)
    })
    document.querySelector(".studio-main").style.gridTemplateColumns = "360px auto 360px"
    },0)
    
}
function closeDocs() {
    document.querySelector(".studio-main").style.gridTemplateColumns = "360px auto 0px"
    document.querySelectorAll(".inspector-row").forEach((child)=>{
        try{
            document.querySelector(".inspector-section").removeChild(child)
        }catch{
            document.getElementById("outputHolder").removeChild(child)
        }
    })
}
document.getElementById("close").addEventListener("click", () => {
    closeDocs()
})
function copyNode(node) {
    const clone = node.cloneNode(true);
    const currentLeft = parseInt(node.style.left || 0, 10);
    const currentTop = parseInt(node.style.top || 0, 10);

    clone.style.left = `${currentLeft + 28}px`;
    clone.style.top = `${currentTop + 28}px`;

    node.parentElement.appendChild(clone);

    attachNodeContextMenu(clone)

    let canvas = document.getElementById("codingCanvas")
    makeCanvasBlockDraggable(clone, canvas);

}

function deleteNode(node) {
    node.remove();
}

document.addEventListener("click", (e) => {
    if (!e.target.closest("#node-context-menu")) {
        if (!contextMenu.classList.contains("hidden")) {
            hideContextMenu();
        }
    }
});

window.addEventListener("resize", () => {
    if (!contextMenu.classList.contains("hidden")) {
        hideContextMenu();
    }
});

window.addEventListener("scroll", () => {
    if (!contextMenu.classList.contains("hidden")) {
        hideContextMenu();
    }
});

const overlay = document.getElementById("settingsOverlay");

document.getElementById("openSettings").addEventListener("click", () => {
    overlay.classList.add("show");
});

document
    .getElementById("cancelSettings")
    .addEventListener("click", () => {

        overlay.classList.remove("show");

    });

overlay.addEventListener("click", (e) => {

    if (e.target === overlay) {

        overlay.classList.remove("show");

    }

});

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        overlay.classList.remove("show");

    }

});

const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".tab-page");

tabs.forEach(tab => {

    tab.onclick = () => {

        tabs.forEach(t => t.classList.remove("active"));
        pages.forEach(p => p.classList.remove("active"));

        tab.classList.add("active");

        document
            .getElementById(tab.dataset.tab)
            .classList.add("active");

    };

});

function log(message, type) {
    document.getElementById("logText").innerHTML = message;
    if (type.toLowerCase() == "error") {
        document.getElementById("status-dot-bottom").style.backgroundColor = "var(--alert)"
    } else if (type.toLowerCase() == "process") {
        document.getElementById("status-dot-bottom").style.backgroundColor = "var(--warn)"
    } else {
        document.getElementById("status-dot-bottom").style.backgroundColor = "var(--success)"
    }
}

document.getElementById("searchNodes").addEventListener("input", () => {
    document.querySelectorAll(".ai-model-sidebar-block").forEach((el) => {
        if (!el.lastElementChild.innerHTML.toLowerCase().includes(document.getElementById("searchNodes").value.toLowerCase())) {
            el.parentElement.parentElement.style.display = "none"
        } else {
            el.parentElement.parentElement.style.display = "block"
        }
    })
})
function createConnection(start, end) {


    const svg = document.querySelector(".connections");


    const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );


    path.classList.add("connection-line");



    const startX = start.x;
    const startY = start.y;


    const endX = end.x;
    const endY = end.y;



    const curve = 120;



    const d = `
        M ${startX} ${startY}

        C 
        ${startX + curve} ${startY},
        ${endX - curve} ${endY},
        ${endX} ${endY}
    `;



    path.setAttribute("d", d);



    svg.appendChild(path);

    return path;

}
function getSocketPosition(socket) {

    const rect = socket.getBoundingClientRect();

    const canvas =
        document.querySelector("#codingCanvas")
            .getBoundingClientRect();


    return {

        x: rect.left - canvas.left + rect.width / 2,

        y: rect.top - canvas.top + rect.height / 2

    };

}
document.addEventListener("click", (e)=>{

    if(!e.target.classList.contains("ai-mini-port-dot")){
        if(activeNode != null){
        activeNode.style.boxShadow="";
        activeNode=null;}
        return;
    }
    const el = e.target;


    if(activeNode == null){

        activeNode = el;

        el.style.boxShadow =
        "0 0 15px #5fa8ff";

    }

    else{

        createConnection(
            getSocketPosition(activeNode),
            getSocketPosition(el)
        );


        activeNode.style.boxShadow="";

        activeNode=null;

    }

});


