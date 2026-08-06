let activeNode;
const parser = new DOMParser()
const currentProjectID = new URLSearchParams(window.location.search).get("projectId");
const serializer = new XMLSerializer();
if (currentProjectID == null || currentProjectID == undefined) {
    window.location.assign("dashboard.html")
}
const HUB_URL = "ws://inventa-hub.local/ws";
let socket;
let modules = [];
let project = JSON.parse(window.localStorage.getItem("projects"))
project = JSON.parse(project.find((pro) => {
    return JSON.parse(pro).id == currentProjectID
}))
document.getElementById("export").addEventListener("click", () => {
    let projectToSave = JSON.parse(window.localStorage.getItem("projects"))
    projectToSave = projectToSave.find((pro) => {
        return JSON.parse(pro).id == currentProjectID
    })
    console.log(projectToSave)
    const blob = new Blob(
        [projectToSave],
        {
            type: "application/x-inventa"
        }
    );


    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    let projectDetails = JSON.parse(window.localStorage.getItem("projects"))
    projectDetails = JSON.parse(projectDetails.find((pro) => {
        return JSON.parse(pro).id == currentProjectID
    }))
    link.download = `${project.name}.inventa`;

    link.click();
})
document.getElementById("loadFile").addEventListener("change", () => {
        const file = document.getElementById("loadFile").files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {

            const Newproject = event.target.result;

            loadProject(Newproject);
        };
        reader.readAsText(file);
    })
document.getElementById("load").addEventListener("click", () => {
    document.getElementById("loadFile").click()
    
})
function loadProject(file) {
                let project = JSON.parse(window.localStorage.getItem("projects"))
                file = JSON.parse(file)
                let isIdPresent = project.findIndex((pro) => {
                    return JSON.parse(pro).id == file.id
                })
                if (isIdPresent == -1) {
                    project.push(JSON.stringify(file))
                    project = JSON.stringify(project)
                    window.localStorage.setItem("projects", project)

                    let link = document.createElement("a")
                    link.style.display = "none"
                    link.target = "_blank"
                    link.href = `studio.html?projectId=${encodeURIComponent(file.id)}`
                    link.click()
                } else {
                    file.id = self.crypto.randomUUID()
                    file.name = file.name + "Copy #{"+project.length+"} "
                    project.push(JSON.stringify(file))
                    project = JSON.stringify(project)
                    window.localStorage.setItem("projects", project)
                     let link = document.createElement("a")
                    link.style.display = "none"
                    link.target = "_blank"
                    link.href = `studio.html?projectId=${encodeURIComponent(file.id)}`
                    link.click()
                }
            }
let fail = false;
document.addEventListener("DOMContentLoaded", () => {
    setupSidebarDrag();
    log("Connecting To Hub", "process");
    connectToHub();
    setInterval(() => {
        if (fail) {
            document.querySelector(".status-dot-hub").style.backgroundColor = "#FF4D4D";
            document.getElementById("hubStatus").innerHTML = `Retrying Connection`;
            log("Retrying Connection", "error");
        }
        connectToHub();
    }, 15000)

});
let nodeGraph = {
    nodes: [],
    variables: [],
    connections: [],
    notes: [],
}


if (project.nodeGraph != null && project.nodeGraph != undefined) {

    let canvas = document.getElementById("codingCanvas")
    let nodeGraphStructure = JSON.parse(project.nodeGraph)
    nodeGraphStructure.nodes.forEach((node) => {
        node = JSON.parse(node)
        nodeGraph.nodes.push(node)
        let block
        document.querySelectorAll(".sidebar-list .ai-model-sidebar-block").forEach((b) => {
            if (b.children[1].innerHTML == node.name) {
                block = b
            }
        })
        const canvasRect = canvas.getBoundingClientRect();
        const clone = block.cloneNode(true);
        clone.classList.add("canvas-block");
        clone.id = node.id
        clone.style.position = "absolute";
        clone.style.zIndex = "20";
        const rect = block.getBoundingClientRect();
        clone.style.width = rect.width + "px";
        clone.style.left = (node.position[0]) + "px";
        clone.style.top = (node.position[1]) + "px";


        clone.style.pointerEvents = "auto";
        clone.style.zIndex = "20";
        let universalConnector = document.createElement("div")
        universalConnector.classList.add('ai-mini-port-row')
        universalConnector.innerHTML = `
        <span class="ai-mini-port-dot any"></span>
        <span class="ai-mini-port-label">Universal Connector</span>
        `

        if (clone.children[1].innerHTML != "Break") {
            let endPort = document.createElement("div")
            endPort.classList.add('ai-mini-port-row')
            endPort.innerHTML = `
        <span class="ai-mini-port-label">Next Node</span>
        <span class="ai-mini-port-dot any"></span>
        `
            clone.children[0].lastElementChild.appendChild(endPort)
        }


        clone.children[0].children[0].appendChild(universalConnector)
        canvas.appendChild(clone);
        attachNodeContextMenu(clone)
        makeCanvasBlockDraggable(clone, canvas);

    })
    nodeGraphStructure.connections.forEach((con) => {
        con = JSON.parse(con)
        let startNode = document.getElementById(con.toNode)
        let endNode = document.getElementById(con.fromNode)
        let startSocket = startNode.querySelectorAll(".ai-mini-port-label")
        let startPos;
        let endPos;
        let toSocket
        let side;

        startSocket.forEach((child) => {
            if (child.innerHTML == con.toSocket) {
                startSocket = child.parentElement.querySelector(".ai-mini-port-dot")
                startPos = getSocketPosition(child.parentElement.querySelector(".ai-mini-port-dot"))
                side = child.parentElement.parentElement.classList[0]

            }
        })
        if (startPos != null) {
            if (side == "ai-model-sidebar-left") {
                let toNode = document.getElementById(con.fromNode)
                toSocket = endNode.querySelectorAll(".ai-model-sidebar-right .ai-mini-port-label")
                toSocket.forEach((child) => {
                    if (child.innerHTML == con.fromSocket) {
                        toSocket = child.parentElement.querySelector(".ai-mini-port-dot")
                        endPos = getSocketPosition(child.parentElement.querySelector(".ai-mini-port-dot"))
                    }
                })
            } else {

                let toNode = document.getElementById(con.fromNode)
                toSocket = endNode.querySelectorAll(".ai-model-sidebar-left .ai-mini-port-label")
                toSocket.forEach((child) => {
                    if (child.innerHTML == con.fromSocket) {
                        toSocket = child.parentElement.querySelector(".ai-mini-port-dot")
                        endPos = getSocketPosition(child.parentElement.querySelector(".ai-mini-port-dot"))
                    }
                })
            }
        } else {
            startSocket.forEach((child) => {
                if (child.innerHTML == con.fromSocket) {
                    startSocket = child.parentElement.querySelector(".ai-mini-port-dot")
                    startPos = getSocketPosition(child.parentElement.querySelector(".ai-mini-port-dot"))
                    side = child.parentElement.parentElement.classList[0]
                }
            })
            if (side == "ai-model-sidebar-left") {
                let toNode = document.getElementById(con.toNode)
                toSocket = endNode.querySelectorAll(".ai-model-sidebar-right .ai-mini-port-label")
                toSocket.forEach((child) => {
                    if (child.innerHTML == con.toSocket) {
                        toSocket = child.parentElement.querySelector(".ai-mini-port-dot")
                        endPos = getSocketPosition(child.parentElement.querySelector(".ai-mini-port-dot"))
                    }
                })
            } else {

                let toNode = document.getElementById(con.toNode)
                toSocket = endNode.querySelectorAll(".ai-model-sidebar-left .ai-mini-port-label")
                toSocket.forEach((child) => {
                    if (child.innerHTML == con.toSocket) {
                        toSocket = child.parentElement.querySelector(".ai-mini-port-dot")
                        endPos = getSocketPosition(child.parentElement.querySelector(".ai-mini-port-dot"))
                    }
                })
            }
        }
        createConnection(startPos, endPos, con.id)
        con.pos[0] = startSocket
        con.pos[1] = toSocket
        nodeGraph.connections.push(con)
    })
}

document.getElementById("firstprojName").innerHTML = project.name.substring(0, Math.round(project.name.length / 6))
document.getElementById("secondprojName").innerHTML = project.name.substring(Math.round(project.name.length / 6), project.name.length - Math.round(project.name.length / 4))
document.getElementById("LastprojName").innerHTML = project.name.substring(project.name.length - Math.round(project.name.length / 4), project.name.length)
class node {
    constructor(name, inputValues, outputValues, description, blockCategory) {
        this.name = name
        this.inputValues = inputValues
        this.outputValues = outputValues
        this.description = description
        this.blockCategory = blockCategory
    }

}
class nodeGraphItem {
    constructor(name, id, inputValues, outputValues, position) {
        this.name = name
        this.id = id
        this.inputValues = inputValues
        this.outputValues = outputValues
        this.position = position
    }
}
class noteItem {
    constructor(name, id, value, icon, classify, position) {
        this.name = name
        this.id = id
        this.value = value
        this.icon = icon
        this.classify = classify
        this.position = position
    }
}
let noteIcons = ["🤖", "👻", "☠️", "🎃", "🧌", "🦐", "🐧", "🐢", "🎄", "🌚", "🌒", "🎮"];
document.getElementById("data-workspace").addEventListener("click", () => {
    window.location.assign(`data.html?projectId=${encodeURIComponent(currentProjectID)}`);
})
const nodeLibrary = [
    new node("Create Classification Model",
        [
            { input: "Data Column", category: "data", acceptedTypes: ["<br>DataColumn", " <br>Variable&lt;List&gt;"], description: "The data column that will be passed into the AI model for classification." },
            { input: "Categories", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The possible categories it can be sorted into." },
            { input: "Condition", category: "condition", acceptedTypes: ["Condition"], description: "The condition created by the condition builder block. In this case the control variable is value of the data in each column" },
        ],
        [
            { output: "AI Model", category: "ai", outputType: "AI Model", description: "An AI Model that can be used to predict outcomes using data" },
        ],
        "Create a classification model that can classify any input into given categories by using the categories variable and condition. This can be used in 'Predict' node to get output from the model",
        "ai"
    ),
    new node("Create Regression Model",
        [
            { input: "Data Column", category: "data", acceptedTypes: ["<br>DataColumn", "<br>Variable&lt;List&gt;"], description: "The data column that will be passed into the AI model for regression." },
            { input: "Factor Columns", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "A list of columns that should be taken into account when creating thee regression. Must be columns containing numerical data" },
        ],
        [
            { output: "AI Model", category: "ai", outputType: "AI Model", description: "An AI Model that can be used to predict outcomes using data" },
        ],
        "Create a regression model that trains on collected data and can make numerical predictions, taking into account the necessary factors",
        "ai"
    ),
    new node("Evaluate Model",
        [
            { input: "AI Model", category: "ai", acceptedTypes: ["AI Model"], description: "An AI model that will be used to make predictions. It could be a classification or regression model." },
            { input: "Data Input", category: "category", acceptedTypes: ["<br>Variable&lt;List&gt;", "<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>DataColumn"], description: "The data that should be used for evaluation. This should be an input value with an already confirmed answer" },
            { input: "Expected Value", category: "category", acceptedTypes: ["<br>Variable&lt;List&gt;", "<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>DataColumn"], description: "The expected value the model was supposed to return" },
        ],
        [
            { output: "Accuracy", category: "ops", outputType: ["Number"], description: "Percent accuracy of the model based on the data that was passed in" },
        ],
        "Evaluate the accuracy of the model by using an existing data point not in the data set used to create model and test the accuracy",
        "ai"
    ),
    new node("Predict",
        [
            { input: "AI Model", category: "ai", acceptedTypes: ["AI Model"], description: "An AI model that will be evaluated" },
            { input: "Data Input", category: "category", acceptedTypes: ["<br>Variable&lt;List&gt;", "<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>DataColumn"], description: "The data that should be used for prediction" },
        ],
        [
            {
                output: "Prediction", category: "all", outputType: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "A prediction made by an AI Model"
            },
        ],
        "Use the AI models to make predictions on new data or existing data",
        "ai"
    ),
    new node("Speech To Text",
        [
            { input: "Audio", category: "media", acceptedTypes: ["<br>Audio", "<br>Variable&lt;List&gt;", "<br>DataColumn"], description: "An audio or a list of audio files to transcribe" },
        ],
        [
            { output: "Text", category: "string", outputType: ["<br>String", "<br>Variable&lt;List&gt;", "<br>Variable&lt;String&gt;", "<br>DataColumn"], description: "The transribed text of the input audio" },
        ],
        "Convert speech captured in an audio file into a string",
        "ai"
    ),
    new node("Text To Speech",
        [
            { input: "Text", category: "category", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;List&gt;", "<br>DataColumn", "<br>String"], description: "A string or a list of strings to covert to an audio media file" },
        ],
        [
            { output: "Audio", category: "media", outputType: ["<br>Audio", "<br>Variable&lt;List&gt;", "<br>DataColumn"], description: "The transribed text of the input audio" },
        ],
        "Convert speech captured in an audio file into a string",
        "ai"
    ),
    new node("Load Data",
        [
            { input: "Data File", category: "data", acceptedTypes: ["Dropdown Select"], description: "A configured data file to load. To configure one with connected sensors go to 'Data Workspace'" },
        ],
        [
            { output: "Data", category: "data", outputType: ["Data"], description: "A usable data node that can be constructed into a data set using the 'Create Data Set' node" },
        ],
        "Loads a configured .invds data set file into a usable data node",
        "data"
    ),

    new node("Create Data Set",
        [
            { input: "Data", category: "data", acceptedTypes: ["Data"], description: "Data node for use and modification wih column labels" },
            { input: "Column Names", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list of column names in order of left to right of the original data file. The length of this list should be the same as the number of columns the original data set had minus the row ID column." },
        ],
        [
            { output: "Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "An actual data set with appropriate row ID's and column names" },
        ],
        "The first step in preparing for data analysis and machine learning by assigning column names to the data's columns",
        "data"
    ),
    new node("Add Row",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that the new row should be added to" },
            { input: "Values", category: "category", acceptedTypes: ["<br>Variable&lt;List&gt;", "<br>Dataset&lt;Row&gt;"], description: "The values of the row that is being added. It could be a list with the same length as the number of columns of the data set or it could be a data set of the same column number particularly a funtion that returns some rows." },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["<br>Dataset&lt;Full&gt;", "<br>Dataset&lt;Row&gt;"], description: "Returns both the row that was added and the full modified dataset.  The preffered output will be automatically selected by the node's application" },
        ],
        "Adds a row to an existing data set",
        "data"
    ),
    new node("Conditional Remove Row",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that the new row should be removed from" },
            { input: "Condition", category: "condition", acceptedTypes: ["Condition"], description: "A special conditional that determines if a row should be removed. In this case the 'Control Variable' is the row." },

        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["<br>Dataset&lt;Full&gt;", "<br>Dataset&lt;Row&gt;"], description: "Returns both the rows that were removed and the full modified dataset. The preffered output will be automatically selected by the node's application" },
        ],
        "Uses a special control function to remove the rows that meet the condition being checked",
        "data"
    ),
    new node("ID Remove Row",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that the new row should be added to" },
            { input: "ID", category: "category", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>String"], description: "The ID of the row that should be removed. It could be a string or a number so look at the data workspace to identify" },

        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["<br>Dataset&lt;Full&gt;", "<br>Dataset&lt;Row&gt;"], description: "Returns both the row that was removed and the full modified dataset. The preffered output will be automatically selected by the node's application" },
        ],
        "Removes a row by using its ID",
        "data"
    ),
    new node("Filter Rows",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that the new row should be removed from" },
            { input: "Condition", category: "condition", acceptedTypes: ["Condition"], description: "A special conditional that determines if a row should be kept. In this case the 'Control Variable' is the row." },

        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["<br>Dataset&lt;Full&gt;", "<br>Dataset&lt;Row&gt;"], description: "Returns both the rows that were removed and the full modified dataset. The preffered output will be automatically selected by the node's application" },
        ],
        "Uses a special control function to remove the rows that meet the condition being checked",
        "data"
    ),
    new node("Get Row",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set the row should be gotten from" },
            { input: "ID", category: "category", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>String", "<br>Number"], description: "The ID of the row that should be gotten" },
        ],
        [
            { output: "Row", category: "data", outputType: ["Dataset&lt;Row&gt;"], description: "The row with the specified ID from the specified dataset" },
        ],
        "Gets a specific row from a dataset using its ID",
        "data"
    ),

    new node("Sort Dataset",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that should be sorted" },
            { input: "Column", category: "data", acceptedTypes: ["DataColumn"], description: "The column to be sorted using the sort function" },
            { input: "Sort Function", category: "number", acceptedTypes: ["Function&lt;Sort&gt;"], description: "A special function made in the function creator that sorts the values of column" },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "This is the returned dataset after the sort function is applied" },
        ],
        "Uses a special sort funtion to sort the specified column in the data set and returns the sorted dataset",
        "data"
    ),
    new node("Get Column",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that the column should be retrieved from" },
            { input: "Column Name", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The title of the column to get" },
        ],
        [
            { output: "Column", category: "data", outputType: ["DataColumn"], description: "The returned column in the dataset associated with the column name" },
        ],
        "Gets the column in the data set associated with the column name",
        "data"
    ),
    new node("Add Column",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that the column should be added to" },
            { input: "Column Name", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The title of the column to add" },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "The dataset with the new column added. Note that all the rows of the new column will have empty values" },
        ],
        "Add a column to an existing data set",
        "data"
    ),
    new node("Delete Column",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that the column should be added to" },
            { input: "Column Name", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The title of the column to add" },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "The dataset with the new column added. Note that all the rows of the new column will have empty values" },
        ],
        "Add a column to an existing data set",
        "data"
    ),
    new node("Rename Column",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that contains the column that should be renamed" },
            { input: "Old Column Name", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The previous column name" },
            { input: "New Column Name", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The new column name" },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "The dataset with the new column added. Note that all the rows of the new column will have empty values" },
        ],
        "Rename a column in an existing data set",
        "data"
    ),

    new node("Remove Missing Values",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set to check for and remove null values" },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "The original data set with all rows containing null values removed" },
        ],
        "Removes all the rows with missing value",
        "data"
    ),
    new node("Fill Missing Values",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set to check for and remove null values" },
            { input: "Value", category: "category", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>Variable&lt;Boolean&gt;"], description: "The data set to check for and remove null values" },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "The original data set with all null values filled up with 'Value'" },
        ],
        "Fills all the cells with null values with 'Value'",
        "data"
    ),
    new node("Average Column",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that contains the numerical column of data for averaging" },
            { input: "Column", category: "data", acceptedTypes: ["DataColumn"], description: "The column containing <strong style='color:white'>only<strong> numerical data for averaging" },
        ],
        [
            { output: "Average", category: "ops", outputType: ["Number"], description: "The average of all the values in the column" },
        ],
        "Gets the average of all the numbers in a column",
        "data"
    ),
    new node("Max Column",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that contains the numerical column of data where the max value will be searched for" },
            { input: "Column", category: "data", acceptedTypes: ["DataColumn"], description: "The column containing <strong style='color:white'>only<strong> numerical data where the max value will be searched for" },
        ],
        [
            { output: "Max", category: "ops", outputType: ["Number"], description: "The maximim number in the column" },
        ],
        "Gets the max number in a column",
        "data"
    ),
    new node("Get All Column Names",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The dataset to return the number of columns" },
        ],
        [
            { output: "Column Names", category: "category", outputType: ["<br>Variable&lt;List&gt;"], description: "All the column names in the dataset" },
        ],
        "Gets all the column names in the dataset",
        "data"
    ),
    new node("Count Rows",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The dataset to count the number of rows" },
        ],
        [
            { output: "Number of Rows", category: "ops", outputType: ["Number"], description: "The number of rows in the dataset" },
        ],
        "Gets the number of rows in the dataset",
        "data"
    ),
    new node("Get Cell Value",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set where the value should be retrieved from" },
            { input: "Column", category: "data", acceptedTypes: ["DataColumn"], description: "The column that should be accessed for searching" },
            { input: "Row", category: "data", acceptedTypes: ["Dataset&lt;Row&gt;"], description: "The row that should be accessed for searching" },
        ],
        [
            { output: "Value", category: "category", outputType: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>Variable&lt;Boolean&gt;"], description: "The dataset with the new column added. Note that all the rows of the new column will have empty values" },
        ],
        "Get the value of a column-row intersection from a dataset",
        "data"
    ),
    new node("Replace Cell Value",
        [
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set where the value should be retrieved from" },
            { input: "Row", category: "data", acceptedTypes: ["Dataset&lt;Row&gt;"], description: "The row that should be accessed for searching" },
            { input: "Column", category: "data", acceptedTypes: ["DataColumn"], description: "The column that should be accessed for searching" },
            { input: "Value", category: "category", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>Variable&lt;Booleans&gt;"], description: "The value to replace the original value with" },
        ],
        [
            { output: "Modified Dataset", category: "data", outputType: ["Dataset&lt;Full&gt;"], description: "The modified dataset with the appointed cell value changed" },
        ],
        "Replace a value in the data set",
        "data"
    ),
    new node("Export Dataset To Data Workspace",
        [
            { input: "Data Title", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The title of the workspace tab" },
            { input: "Dataset", category: "data", acceptedTypes: ["Dataset&lt;Full&gt;"], description: "The data set that should be exported to the data workspace for viewing" },
        ],
        [
            { output: "None", category: "any", outputType: ["None"], description: "There are no outputs for this node" },
        ],
        "Export a data set to the the data workspace",
        "data"
    ),
    new node("Create String",
        [
            { input: "Text Input", category: "string", acceptedTypes: ["Text Input"], description: "A simple piece of text. One time use except if used to create a variable or if stored in a list." },
        ],
        [
            { output: "String", category: "string", outputType: ["String"], description: "Outputs a usable string which can be used directly with any String Variable inputs or String inputs" },
        ],
        "Creates a simple string of text",
        "category"
    ),
    new node("Create Number",
        [
            { input: "Number Input", category: "ops", acceptedTypes: ["Number Input"], description: "A simple number. The number can be negative or positive. This can range from <strong> -(2<sup>53</sup> -1)</strong> to <strong>1.79 x 10<sup>308</sup></strong>" },
        ],
        [
            { output: "Number", category: "ops", outputType: ["Number"], description: "A simple number. The number can be negative or positive. This can range from <strong> -(2<sup>53</sup> -1)</strong> to <strong>1.79 x 10<sup>308</sup></strong>" },
        ],
        "Creates a simple number",
        "category"
    ),
    new node("Create Boolean",
        [
            { input: "Boolean Dropdown", category: "bool", acceptedTypes: ["Boolean Dropdown"], description: "A simple boolean. True or False" },
        ],
        [
            { output: "Boolean", category: "bool", outputType: ["Boolean"], description: "A simple true ot false output" },
        ],
        "Creates a simple number",
        "category"
    ),
    new node("Create Variable",
        [
            { input: "Name", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The name of the variable to be created" },
            {
                input: "Value", category: "all", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"],
                description: "The value of the variable. Leave blank for default null value. Also keep in mind <strong>The variable will only store data types it was first initialized with</strong>. This means that if you create a variable and the first value you assign to it is a string it an only store strings."
            },
            { input: "isMutable?", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&lt;Boolean&gt;"], description: "Is the variable too be changed leter on. If the value is not meant set this to false otherwise if you plan to change the value of this variahle set it to true" },

        ],
        [
            {
                output: "Variable", category: "category", outputType: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;Ai Model&gt;"], description: "Create an accessible method of storage for any values that need to change or need to be repeatedly accessed. This acts as a layer on top of the traditional primitive creates and allows you to store anything"
            },
        ],
        "Creates a storage bucket for values used within the node editor for storing a multitude of data types.",
        "category"
    ),

    new node("Get Control Variable",
        [
            { input: "Variable Dropdown", category: "variable", acceptedTypes: ["Variable Dropdown"], description: "This allows you to select a control variable which is identified when connected to a 'Condition Builder' which would be connected to a special condition input" },

        ],
        [
            {
                output: "Control Variable", category: "category", outputType: ["ControlVariable"], description: "A special variable type necessary for condition buiding"
            }
        ],
        "Get the appropriate control variable for a particular condition buider",
        "category"
    ),
    new node("Set Variable",
        [
            {
                input: "Variable", category: "variable", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Variable&lt;List&gt;"], description: "The variable to change"
            },
            {
                input: "New Value", category: "variable", acceptedTypes: ["<br>String", "<br>Number", "<br>Boolean", "<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;",
                    "<br>DataColumn", "AI Model"], description: "The value to be replacing the original value with. Keep in mind that both value types have to match: If a variable originally stored Numbers it can only store Numbers"
            },
        ],
        [
            {
                output: "Modified Variable", category: "category", outputType: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Others..."], description: "The resulting variable from the set"
            }
        ],
        "Set the value of an exisitng variable by overriding it",
        "category"
    ),
    new node("Change Variable By",
        [
            { input: "Variable", category: "variable", acceptedTypes: ["<Variable&lt;Number&gt;"], description: "The variable to change" },
            { input: "Amount", category: "ops", acceptedTypes: ["<br>Number", "<br>Variable&lt;Number&gt;",], description: "The value to increment the number variablle by" },
        ],
        [
            {
                output: "Modified Variable", category: "category", outputType: ["<Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Others..."], description: "The resulting variable from the set"
            }
        ],
        "Set the value of an exisitng variable by overriding it",
        "category"
    ),
    new node("Get Variable",
        [
            { input: "Variable Dropdown", category: "variable", acceptedTypes: ["VariableDropdown"], description: "Get a variable reference in order to change its value" },

        ],
        [
            {
                output: "Variable", category: "category", outputType: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Others..."], description: "A storage bucket with values stored in it"
            }
        ],
        "Gets a variable",
        "category"
    ),
    new node("Create List",
        [
            { input: "Name", category: "string", acceptedTypes: ["<br>String", "<br>Variable&lt;String&gt;"], description: "The name of the list variable to be created. This is necessary for access in the 'Get Variables' node" },
            {
                input: "Starting Items", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;", "<br>Boolean",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "Starting items to be stored in the list. Unlike variables lists can store different data types"
            },

        ],
        [
            {
                output: "List", category: "category", outputType: ["Variable&lt;List&gt;"], description: "A list of items"
            }
        ],
        "Create a list of items",
        "category"
    ),
    new node("Add To List",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to add to" },
            {
                input: "Items", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The item or items to be added to the list"
            },

        ],
        [
            {
                output: "Modified List", category: "category", outputType: ["Variable&lt;List&gt;"], description: "A list of items with the added items"
            }
        ],
        "Add items to a list",
        "category"
    ),
    new node("Itemed Remove From List",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to remove from" },
            {
                input: "Items", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The items to remove from the list"
            },

        ],
        [
            {
                output: "Modified List", category: "category", outputType: ["Variable&lt;List&gt;"], description: "A list of items with the specified items removed"
            }
        ],
        "Remove items from a list using their name. This node will remove any occurene of that item in the list. For more precise removal use the other remove methods",
        "category"
    ),
    new node("Indexed Remove From List",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to remove from" },
            { input: "Index", category: "ops", acceptedTypes: ["<br>Number", "<br>Variable&lt;Number&gt;", "<br>Variable&lt;List&gt;"], description: "The index or list of indexes to remove from the list" },
        ],
        [
            {
                output: "Modified List", category: "category", outputType: ["Variable&lt;List&gt;"], description: "A list with the specified indexes removed. The list's indexes are updated after the node is run not during. So if the list indexes speified are 0,1,2 it will remove the items at 0,1,2 as viewed originally"
            }
        ],
        "Removes items from a list using the specified indexes",
        "category"
    ),
    new node("Conditioned Remove From List",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to remove from" },
            { input: "Condition", category: "condition", acceptedTypes: ["Condition"], description: "The condition created by the condition builder block. In this case the control variable is the item in the list or it could be the index." },
        ],
        [
            {
                output: "Modified List", category: "category", outputType: ["Variable&lt;List&gt;"], description: "A list with the items that satisfy the condition removed"
            }
        ],
        "Remove items from a list using a condition. This node will remove all values in the list that satisfy the condition",
        "category"
    ),
    new node("Get List Item",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to get items from" },
            { input: "Index", category: "ops", acceptedTypes: ["<br>Number", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Number&gt;"], description: "The indexes to get the items from. If you use a list of indexes you will get a list of all the items" },
        ],
        [
            {
                output: "List Item", category: "any", outputType: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The list items that match the specified indexes"
            }
        ],
        "Get items from a list using their index. You may use a single number, a variable of type number, or a list",
        "category"
    ),
    new node("Get Item Index",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to search through" },
            {
                input: "List Item", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The list item to search for. Keep in mind that if the list item is not found it will return an index of -1"
            },
        ],
        [
            {
                output: "Index", category: "ops", outputType: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The index or indexes that are found to match the list item specified"
            }
        ],
        "Get the index of a specific item in a list",
        "category"
    ),
    new node("List Contains Item?",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to search through" },
            {
                input: "List Item", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The list item to search for. This node will return true if the items is found"
            },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["<br>Variable&lt;Boolean&gt;", "<br>Boolean"], description: "Returns true if the item is found in the list; returns false otherwise"
            }
        ],
        "Checks if the specified item can be found inside the list",
        "category"
    ),
    new node("Get List Length",
        [
            { input: "Variable", category: "category", acceptedTypes: ["Variable&lt;List&gt;"], description: "The list to find the length of" },
        ],
        [
            {
                output: "List Length", category: "ops", outputType: ["Number"], description: "The length of the list specified as an input to the node"
            }
        ],
        "Gets the length of a list",
        "category"
    ),
    new node("Join Strings",
        [
            { input: "String #1", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The first string" },
            { input: "String #2", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The second string" },
        ],
        [
            {
                output: "Mutated String", category: "string", outputType: ["String"], description: "The result of the combined strings"
            }
        ],
        "Concatenates two strings together",
        "string"
    ),
    new node("Get String Length",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to identify the length of" },
        ],
        [
            {
                output: "Length", category: "ops", outputType: ["Number"], description: "The length of the string"
            }
        ],
        "Gets the length of the string",
        "string"
    ),
    new node("Get Character At",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search through" },
            { input: "Index", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The index in the string to get the character of" },
        ],
        [
            {
                output: "Character", category: "string", outputType: ["String"], description: "The character at a speified index. Indexes start at 0 and end at stringLength - 1 if the index does not exist within the string it will return null"
            }
        ],
        "Gets the character of a string at a specified index",
        "string"
    ),
    new node("Get Character At",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search through" },
            { input: "Index", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The index in the string to get the character of" },
        ],
        [
            {
                output: "Character", category: "string", outputType: ["String"], description: "The character at a specified index. Indexes start at 0 and end at stringLength - 1 if the index does not exist within the string it will return null"
            }
        ],
        "Gets the character of a string at a specified index",
        "string"
    ),
    new node("Substring",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to fragment" },
            { input: "Start Index", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The index to start with. This is inclusive so when the node is run it will account for this" },
            { input: "End Index", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The index to end with. This is <strong>exclusive</strong> so when the node is run it will not account for this and will stop one index before this. Keep in mind that if this goes beyond the max index (stringLength) then it would just end up on the last index " },
        ],
        [
            {
                output: "Extracted String", category: "string", outputType: ["String"], description: "The string found within the specified indexes."
            }
        ],
        "Gets a string fragment found within the specified index",
        "string"
    ),
    new node("Contains Text",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search through" },
            { input: "Text", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search for" },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "Checks if the given text can be found inside the string. Take note that this node is case sensitive."
            }
        ],
        "Checks if a string contains a particular text",
        "string"
    ),
    new node("Starts With",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search through" },
            { input: "Text", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search for" },
            { input: "Start Length", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The descriptor of what exactly what exactly the end of the start of the string is. So if this is demarcated as 1 it will only check if the first item in the string is equal to the the specified text. Keep in mind that this node is case sensitive." },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "Checks within the specified length from the first until the specified length if the values are equivalent to the Text parameter "
            }
        ],
        "Checks if a string starts with a particular string as determined by the Start Length parameter",
        "string"
    ),
    new node("Ends With",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search through" },
            { input: "Text", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search for" },
            { input: "End Length", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The descriptor of what exactly what exactly the end of the end of the string is. So if this is demarcated as 1 it will only check if the last item in the string is equal to the the specified text. Keep in mind that this node is case sensitive." },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "Checks within the specified length from the end of the string until the specified length if the values are equivalent to each other"
            }
        ],
        "Checks if a string end with a particular string as determined by the End Length parameter",
        "string"
    ),
    new node("Text Based Replace String",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon" },
            { input: "Find String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to search for. Keep in mind if the text isn't found the node will do nothing" },
            { input: "Replacement String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to replace it with" },
        ],
        [
            {
                output: "Modified String", category: "string", outputType: ["String"], description: "The modified string after the node runs"
            }
        ],
        "Replaces a piece of text found within the string with another text. If the same text is found repeatedly within the string ",
        "string"
    ),
    new node("Index Based Replace String",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon" },
            { input: "Start Index", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The index to start with. This is inclusive so when the node is run it will account for this" },
            { input: "End Index", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The index to end with. This is <strong>exclusive</strong> so when the node is run it will not account for this and will stop one index before this. Keep in mind that if this goes beyond the max index (stringLength) then it would just end up on the last index " },
            { input: "Replacement String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to replace it with" },
        ],
        [
            {
                output: "Modified String", category: "string", outputType: ["String"], description: "The modified string after the node runs"
            }
        ],
        "Replaces a piece of text using it's index with another text",
        "string"
    ),
    new node("Make lowercase",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon" },
        ],
        [
            {
                output: "Modified String", category: "string", outputType: ["String"], description: "The string converted into lowercase"
            }
        ],
        "Converts a string to lowercase",
        "string"
    ),
    new node("Make UPPERCASE",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon" },
        ],
        [
            {
                output: "Modified String", category: "string", outputType: ["String"], description: "The string converted into UPPERCASE"
            }
        ],
        "Converts a string to UPPERCASE",
        "string"
    ),
    new node("Trim String",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon" },
        ],
        [
            {
                output: "Modified String", category: "string", outputType: ["String"], description: "The string with all the spaces in the beginning and end cut off"
            }
        ],
        "Removes spaces from the beginning and end of a string",
        "string"
    ),
    new node("Repeat String",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon" },
            { input: "Number Of Times", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The number of times the string should be repeated" },
            { input: "Delimeter", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The separator between each string. Leave this blank to have no delimeter and have then all next to each other" },
        ],
        [
            {
                output: "Modified String", category: "string", outputType: ["String"], description: "The string repeated 'Number Of Times' times with the delimeter inbetween each"
            }
        ],
        "Repeats a string and concatenates it to itself repeatedly",
        "string"
    ),
    new node("Split String",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon" },
            { input: "Separator", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string at which the split will be applied separating the string into different parts" },
        ],
        [
            {
                output: "String List", category: "category", outputType: ["<br>Variable&lt;List&gt;"], description: "The list of separated strings"
            }
        ],
        "Separated a string into a list at any occcurence of the separator",
        "string"
    ),
    new node("String To Number",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string this node will be acted upon. Keep in mind that this String must be convertible to a number otherwise it will return null" },
        ],
        [
            {
                output: "Number", category: "ops", outputType: ["Number"], description: "The string converted to a number"
            }
        ],
        "Converts a string to a number",
        "string"
    ),
    new node("Number To String",
        [
            { input: "Number", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The number that will be converted to a string" },
        ],
        [
            {
                output: "String", category: "string", outputType: ["String"], description: "The number converted to a string"
            }
        ],
        "Converts a number to a string",
        "string"
    ),
    new node("isEmpty?",
        [
            { input: "String", category: "string", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>String"], description: "The string to be checked" },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "This will return true if the String is truly empty"
            }
        ],
        "Checks if a string is empty. Keep in mind that a SPACE character does not count as empty. To avoid this use the trim node on the string before applying this node",
        "string"
    ),
    new node("Add Numbers",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The first number" },
            { input: "Number #2", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The second number" },
        ],
        [
            {
                output: "Sum", category: "ops", outputType: ["Number"], description: "The sum of both numbers"
            }
        ],
        "Sums Numbers",
        "ops"
    ),
    new node("Subtract Numbers",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The first number" },
            { input: "Number #2", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The second number" },
        ],
        [
            {
                output: "Difference", category: "ops", outputType: ["Number"], description: "The difference of both numbers. Keep in mind this node will run number 2 - number 1"
            }
        ],
        "Calculates the difference of both numbers",
        "ops"
    ),
    new node("Multiply Numbers",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The first number" },
            { input: "Number #2", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The second number" },
        ],
        [
            {
                output: "Product", category: "ops", outputType: ["Number"], description: "The product of both numbers"
            }
        ],
        "Calculates the product of both numbers",
        "ops"
    ),
    new node("Divide Numbers",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The first number" },
            { input: "Number #2", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The second number" },
        ],
        [
            {
                output: "Product", category: "ops", outputType: ["Number"], description: "The quotient of both numbers. Keep in mind this node does number 2/number 1"
            }
        ],
        "Calculates the quotient of both numbers",
        "ops"
    ),
    new node("Modulus %",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The first number" },
            { input: "Number #2", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The second number" },
        ],
        [
            {
                output: "Remainder", category: "ops", outputType: ["Number"], description: "The remainder of the division of number 2/number 1."
            }
        ],
        "Calculates the remainder of a division between 2 numbers",
        "ops"
    ),
    new node("Round",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The number to round." },
            { input: "Position", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The position to round. For example if this is specified to be 100 (10<sup>2</sup>) it will round to the nearest hundred, if it is 0.1(10<sup>-1</sup>)it will round to the nearest tenth. This can only be values in <strong>exponents of 10</strong>" },
        ],
        [
            {
                output: "Value", category: "ops", outputType: ["Number"], description: "The number rounded in respect to the specified position."
            }
        ],
        "Rounds a number with respect to a specified position. Keep in mind that this will round up if the number of the position before the specified posiion is 5 or greater. It will round down otherwise",
        "ops"
    ),
    new node("Floor",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The number to floor." },
            { input: "Position", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The position to floor. For example if this is specified to be 100 (10<sup>2</sup>) it will floor to the nearest hundred, if it is 0.1(10<sup>-1</sup>)it will floor to the nearest tenth. This can only be values in <strong>exponents of 10</strong>" },
        ],
        [
            {
                output: "Value", category: "ops", outputType: ["Number"], description: "The number floored in respect to the specified position."
            }
        ],
        "Floors a number with respect to a specified position. Keep in mind that this will floor the number irrespective of the preceding value.",
        "ops"
    ),
    new node("Ceil",
        [
            { input: "Number #1", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The number to ceil." },
            { input: "Position", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The position to ceil. For example if this is specified to be 100 (10<sup>2</sup>) it will ceil to the nearest hundred, if it is 0.1(10<sup>-1</sup>)it will ceil to the nearest tenth. This can only be values in <strong>exponents of 10</strong>" },
        ],
        [
            {
                output: "Value", category: "ops", outputType: ["Number"], description: "The number ceiled in respect to the specified position."
            }
        ],
        "Ceils a number with respect to a specified position. Keep in mind that this will ceil the number irrespective of the preceding value. This is also known as the constant round up node.",
        "ops"
    ),
    new node("Generate Random Number",
        [
            { input: "Max", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The max number. This is inclusive so the node will generate a random number taking into account this number as well." },
            { input: "Min", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The min number. This is inclusive so the node will generate a random number taking into account this number as well." },
        ],
        [
            {
                output: "Number", category: "ops", outputType: ["Number"], description: "A random whole number between the specified min and max values."
            }
        ],
        "Generates a random whole number between min and max, including min and max",
        "ops"
    ),
    new node("Degrees To Radians",
        [
            { input: "Degrees", category: "ops", acceptedTypes: ["<br>Variable&lt;Number&gt;", "<br>Number"], description: "The degrees to be converted to radians" },
        ],
        [
            {
                output: "Radian", category: "ops", outputType: ["Radian"], description: "The radian value of the sepcified degree"
            }
        ],
        "Converts a degree to it's corresponding radian.",
        "ops"
    ),
    new node("Radians To Degrees",
        [
            { input: "Radian", category: "ops", acceptedTypes: ["Radian"], description: "The radian to be converted to a degree" },
        ],
        [
            {
                output: "Degrees", category: "ops", outputType: ["Number"], description: "The radian converted to its corresponding degree value"
            }
        ],
        "Converts a radian to a degree",
        "ops"
    ),
    new node("Sine",
        [
            { input: "Radian", category: "ops", acceptedTypes: ["Radian"], description: "The radian to be passed into the sine funtion" },
        ],
        [
            {
                output: "sin(x)", category: "ops", outputType: ["Number"], description: "The sine of the radian value that was passed into the node"
            }
        ],
        "Gets the sine of the radian value",
        "ops"
    ),
    new node("Cosine",
        [
            { input: "Radian", category: "ops", acceptedTypes: ["Radian"], description: "The radian to be passed into the cosine funtion" },
        ],
        [
            {
                output: "cos(x)", category: "ops", outputType: ["Number"], description: "The cosine of the radian value that was passed into the node"
            }
        ],
        "Gets the cosine of the radian value",
        "ops"
    ),
    new node("Tangent",
        [
            { input: "Radian", category: "ops", acceptedTypes: ["Radian"], description: "The radian to be passed into the tangent funtion" },
        ],
        [
            {
                output: "tan(x)", category: "ops", outputType: ["Number"], description: "The tangent of the radian value that was passed into the node"
            }
        ],
        "Gets the tangent of the radian value",
        "ops"
    ),
    new node("Cosecant",
        [
            { input: "Radian", category: "ops", acceptedTypes: ["Radian"], description: "The radian to be passed into the cosecant funtion" },
        ],
        [
            {
                output: "csc(x)", category: "ops", outputType: ["Number"], description: "The cosecant of the radian value that was passed into the node"
            }
        ],
        "Gets the cosecant of the radian value",
        "ops"
    ),
    new node("Secant",
        [
            { input: "Radian", category: "ops", acceptedTypes: ["Radian"], description: "The radian to be passed into the secant funtion" },
        ],
        [
            {
                output: "sec(x)", category: "ops", outputType: ["Number"], description: "The secant of the radian value that was passed into the node"
            }
        ],
        "Gets the secant of the radian value",
        "ops"
    ),
    new node("Cotangent",
        [
            { input: "Radian", category: "ops", acceptedTypes: ["Radian"], description: "The radian to be passed into the cotangent funtion" },
        ],
        [
            {
                output: "cot(x)", category: "ops", outputType: ["Number"], description: "The cotangent of the radian value that was passed into the node"
            }
        ],
        "Gets the cotangent of the radian value",
        "ops"
    ),
    new node("Equals",
        [
            {
                input: "Value #1", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The first value for comparison"
            },
            {
                input: "Value #2", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The second value for comparison"
            },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "The value of the equality node"
            }
        ],
        "Checks if 2 values are equal starting from the length then going on to compare the values",
        "bool"
    ),
    new node("Not Equals",
        [
            {
                input: "Value #1", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The first value for comparison"
            },
            {
                input: "Value #2", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The second value for comparison"
            },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "The value of the non-equality node"
            }
        ],
        "Checks if 2 values are not equal starting from the length then going on to compare the values",
        "bool"
    ),
    new node("Greater Than",
        [
            {
                input: "Value #1", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The first value for comparison"
            },
            {
                input: "Value #2", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The second value for comparison"
            },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "The value of the greater than node"
            }
        ],
        "Checks if value 2 is greater than value 1",
        "bool"
    ),
    new node("Less Than",
        [
            {
                input: "Value #1", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The first value for comparison"
            },
            {
                input: "Value #2", category: "any", acceptedTypes: ["<br>Variable&lt;String&gt;", "<br>Variable&lt;Number&gt;",
                    "<br>Variable&lt;Boolean&gt;", "<br>Dataset", "<br>Dataset&lt;Row&gt;", "<br>Boolean",
                    "<br>DataColumn", "<br>AI Model", "<br>Others...", "<br>Number", "<br>Radian", "<br>Variable&lt;List&gt;", "<br>Variable&lt;Dataset&gt;", "<br>Variable&lt;Dataset&lt;Row&gt;&gt;", "<br>Variable&lt;DataColumn&gt;", "<br>Variable&lt;Radian&gt;", "<br>Variable&lt;AI Model&gt;"], description: "The second value for comparison"
            },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "The value of the less than node"
            }
        ],
        "Checks if value 2 is less than value 1",
        "bool"
    ),
    new node("AND",
        [
            { input: "Boolean #1", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The first boolean to take into account" },
            { input: "Boolean #2", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The second boolean to take into account" },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "Checks if both conditions are true"
            }
        ],
        "Checks if both conditions passed into the node are true and then return true. The classic AND also known as the boolean multiplication method.",
        "bool"
    ),
    new node("OR",
        [
            { input: "Boolean #1", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The first boolean to take into account" },
            { input: "Boolean #2", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The second boolean to take into account" },
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "Checks if at least one of conditions are true"
            }
        ],
        "Checks if one of conditions passed into the node is true and then return true. The classic OR also known as the boolean addition method.",
        "bool"
    ),
    new node("NOT",
        [
            { input: "Boolean", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The boolean to NOT" }
        ],
        [
            {
                output: "Boolean", category: "bool", outputType: ["Boolean"], description: "Flips the value of thee boolean being passed in"
            }
        ],
        "Flips a variable to the opposite of its original value",
        "bool"
    ),
    new node("If",
        [
            { input: "Boolean", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The boolean that defines the if condition" }
        ],
        [
            {
                output: "Do", category: "any", outputType: ["This should map to the next nodes that should run if the boolean is evaluated to be true"], description: "The actions to take if the boolean is true"
            }
        ],
        "Checks if a boolean is true and then runs a specified piece of code if true. Keep in mind that if you use the 'Next Node' port instead of the 'Do' port the code will run irrespective of the boolean and will run asyncronously",
        "bool"
    ),
    new node("Condition Builder",
        [
            { input: "Boolean", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The boolean that defines the condition. You would use the 'Control Variable' in the condition" },
            { input: "Control Variable", category: "category", acceptedTypes: ["ControlVariable"], description: "The control variable of the condition block. This will be auto selected once all the nodes are correctly placed." },

        ],
        [
            {
                output: "Condition", category: "condition", outputType: ["Condition"], description: "The eventual condition output to be used in a corresponding node port."
            }
        ],
        "Creates a special boolean based condition",
        "bool"
    ),
    new node("If-Else",
        [
            { input: "Boolean", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&ltBoolean&lt;"], description: "The boolean that defines the if condition." },

        ],
        [
            {
                output: "If Do", category: "any", outputType: ["This should map to the next nodes that should run if the boolean is evaluated to be true"], description: "The actions to take if the boolean is true"
            },
            {
                output: "Else Do", category: "any", outputType: ["This should map to the next nodes that should run if the boolean is evaluated to be true"], description: "The actions to take if the boolean is false"
            }
        ],
        "Checks if a boolean is true and then runs a specified piece of code if true otherwise it runs the other else system. Keep in mind that if you use the 'Next Node' port instead of the 'Do' port the code will run irrespective of the boolean and will run asyncronously",
        "bool"
    ),
    new node("Repeat",
        [
            { input: "Number Of Times", category: "ops", acceptedTypes: ["<br>Number", "<br>Variable&lt;Number&gt;"], description: "The number of times to run the code under do." },

        ],
        [
            {
                output: "Do", category: "any", outputType: ["This should map to the next nodes that should run everytime until the increment reaches the number of times"], description: "The actions to run everytime"
            },

        ],
        "Repeats a group of nodes over and over a certain number of times",
        "bool"
    ),
    new node("While",
        [
            { input: "Boolean", category: "bool", acceptedTypes: ["<br>Boolean", "<br>Variable&lt;Boolean&gt;"], description: "The condition to check for the loop to keep running" },

        ],
        [
            {
                output: "Do", category: "any", outputType: ["This should map to the next nodes that should run everytime until the boolean evaluates to false"], description: "A set of nodes to run while the condition is true"
            },

        ],
        "Run a set of nodes only while a condition is true",
        "bool"
    ),
    new node("Wait",
        [
            { input: "Milliseconds", category: "ops", acceptedTypes: ["<br>Number", "<br>Variable&lt;Number&gt;"], description: "Amount of time to wait" },

        ],
        [
            {
                output: "Do", category: "any", outputType: ["This should map to the next nodes that should run aftter the wait function is executed"], description: "The set of nodes to run after the wait is up"
            },

        ],
        "Creates a delay for a group of nodes to happen",
        "bool"
    ),
    new node("Break",
        [
            { input: "None", category: "any", acceptedTypes: [], description: "This block has no inputs" },

        ],
        [
            {
                output: "None", category: "any", outputType: [""], description: "This block has no outputs"
            },

        ],
        "Stops a set of nodes from running. This can also stop the entire program.",
        "bool"
    ),
]
document.getElementById("newNote").addEventListener("click", () => {
    document.getElementById("notePopup").style.display = "flex"
})

document.body.addEventListener("click", () => {
    let nodeGraphToSave = {
        nodes: [],
        variables: [],
        connections: [],
        notes: [],
    }
    nodeGraph.nodes.forEach((node) => {
        if (nodeGraphToSave.nodes.findIndex((n) => { return JSON.parse(n).id == node.id }) == -1) {
            nodeGraphToSave.nodes.push(JSON.stringify(node))
        } else if (nodeGraphToSave.nodes.findIndex((n) => { return JSON.parse(n).id == node.id }) != -1 &&
            JSON.parse(nodeGraphToSave.nodes.find((n) => { return JSON.parse(n).id == node.id })).position[0] != node.position[0] || JSON.parse(nodeGraphToSave.nodes.find((n) => { return JSON.parse(n).id == node.id })).position[1] != node.position[1]) {
            let index = nodeGraphToSave.nodes.findIndex((n) => { return JSON.parse(n).id == node.id })
            nodeGraphToSave.nodes.splice(index, 1)
            nodeGraphToSave.nodes.push(JSON.stringify(node))
        }
    })
    nodeGraph.variables.forEach((vars) => {
        if (nodeGraphToSave.variables.findIndex((v) => { return JSON.parse(v).id == vars.id }) == -1) {
            nodeGraphToSave.variables.push(JSON.stringify(vars))
        }
    })
    nodeGraph.connections.forEach((con) => {
        if (nodeGraphToSave.connections.findIndex((c) => { return JSON.parse(c).id == con.id }) == -1) {
            nodeGraphToSave.connections.push(JSON.stringify(con))
        }
    })
    nodeGraph.notes.forEach((not) => {
        if (nodeGraphToSave.notes.findIndex((n) => { return JSON.parse(n).id == not.id }) == -1) {
            nodeGraphToSave.notes.push(JSON.stringify(not))
        }
    })

    let projectToSave = project
    projectToSave.nodeGraph = JSON.stringify(nodeGraphToSave)
    projectToSave = JSON.stringify(projectToSave)
    let allProjects = JSON.parse(window.localStorage.getItem("projects"))
    let projectIndex = allProjects.findIndex((pro) => {
        return JSON.parse(pro).id == currentProjectID
    })
    allProjects.splice(projectIndex, 1)
    allProjects.push(projectToSave)
    window.localStorage.setItem("projects", JSON.stringify(allProjects))

})

let initialScale = 1
document.querySelectorAll('.sidebar-group-toggle').forEach(toggle => {
    const group = toggle.closest('.collapsible-group');
    group.classList.toggle('is-collapsed');

    toggle.addEventListener('click', () => {
        group.classList.toggle('is-collapsed');
    });
});



function connectToHub() {
    socket = new WebSocket(HUB_URL);

    socket.onerror = () => {
        fail = true
        log("Hub failed to connect", "error");
        document.querySelector(".status-dot-hub").style.backgroundColor = "#FF4D4D";
        document.getElementById("hubStatus").innerHTML = `Hub Connection Failed`;
        document.getElementById("OLEDModule").style.display = "none"
    };

    socket.onopen = () => {
        fail = false;
        document.querySelector(".status-dot-hub").style.backgroundColor = "#34D399";
        document.getElementById("hubStatus").innerHTML = `Hub Ready`;
        log("Hub Connected", "success");
    };
    socket.onmessage = (message) => {
        console.log(message)
        if (message.data == "OLED Screen Detected") {
            if (modules.indexOf("OLED") == -1) {
                document.getElementById("OLEDModule").style.display = "block"
                modules.push("OLED");
            }

        } else if (message.data == "OLED Screen Not Detected") {
            if (modules.indexOf("OLED") != -1) {
                document.getElementById("OLEDModule").style.display = "none"
                modules.splice(modules.findIndex((mod) => {
                    return mod == "OLEDModule"
                }), 1)
            }
        }

        if (message.data.indexOf("BMP180 Detected") != -1) {
            if (modules.indexOf("BMP180") == -1) {
                document.getElementById("BMP180").style.display = "block"
                modules.push("BMP180");
            }

        } else if (message.data == "BMP180 Not Found") {
            if (modules.indexOf("BMP180") != -1) {
                document.getElementById("BMP180").style.display = "none"
                modules.splice(modules.findIndex((mod) => {
                    return mod == "BMP180"
                }), 1)
            }
        }

    }

}
document.getElementById("noteTitle").addEventListener("input", () => {
    document.getElementById("titleLength").innerHTML = document.getElementById("noteTitle").value.length
})
document.getElementById("note-close-popup").addEventListener("click", () => {
    document.getElementById("notePopup").style.display = "none"
})
document.getElementById("note-cancel-popup").addEventListener("click", () => {
    document.getElementById("notePopup").style.display = "none"
})
document.getElementById("note-create-popup").addEventListener("click", () => {
    let note = document.createElement('div')
    let title;
    note.classList.add("inventa-note-node")
    if (document.getElementById("noteTitle").value.trim().length == 0) {
        title = "New Note"
    } else {
        title = document.getElementById("noteTitle").value.trim()
    }
    let icon = noteIcons[Math.floor(Math.random() * noteIcons.length)]
    note.innerHTML = ` 
    <div class="note-node-header">

                            <div class="note-node-icon">
                                ${icon}
                            </div>

                            <div class="note-node-title">
                                ${document.querySelector('.selected-category .category-text2 span').innerHTML}
                            </div>

                            <div class="note-node-actions">
                                <button>
                                    ${document.querySelector(".selected-category .category-icon").innerHTML}
                                </button>
                                <button>
                                    &#8942;
                                </button>
                                
                            </div>

                        </div>


                        <div class="note-node-content">

                            <h3>
                                ${title}
                            </h3>

                            <textarea class="note-editor" placeholder="Write your note..."></textarea>

                        </div>


                        <div class="note-node-footer">

                            <span>
                                NOTE
                            </span>

                        </div>`
    const canvas = document.getElementById("codingCanvas");
    let id = self.crypto.randomUUID()
    note.id = id
    canvas.appendChild(note)
    note.style.left = "300px";
    note.style.top = "300px";
    nodeGraph.notes.push(
        new noteItem(title, id, "", icon, document.querySelector('.selected-category .category-text2 span').innerHTML, [parseInt(note.style.left), parseInt(note.style.top)])
    )
    makeNoteDraggable(note, canvas);
    document.getElementById("notePopup").style.display = "none"
})
function makeNoteDraggable(note, canvas) {

    const header = note.querySelector(".note-node-header");

    let dragging = false;
    let shiftX = 0;
    let shiftY = 0;


    header.addEventListener("mousedown", (e) => {

        dragging = true;


        const rect = note.getBoundingClientRect();

        shiftX = e.clientX - rect.left;
        shiftY = e.clientY - rect.top;


        note.style.zIndex = 1000;


        function moveAt(pageX, pageY) {

            const canvasRect = canvas.getBoundingClientRect();


            note.style.left =
                `${pageX - canvasRect.left - shiftX}px`;


            note.style.top =
                `${pageY - canvasRect.top - shiftY}px`;

        }


        function onMouseMove(ev) {

            if (!dragging) return;

            moveAt(ev.pageX, ev.pageY);

        }


        function onMouseUp() {

            dragging = false;

            document.removeEventListener(
                "mousemove",
                onMouseMove
            );

            document.removeEventListener(
                "mouseup",
                onMouseUp
            );
            let noteItemIndex = nodeGraph.notes.findIndex((n) => {
                return n.id == note.id
            })
            nodeGraph.notes[noteItemIndex].position = [parseInt(note.style.left), parseInt(note.style.top)]
        }


        document.addEventListener(
            "mousemove",
            onMouseMove
        );


        document.addEventListener(
            "mouseup",
            onMouseUp
        );

    });

}
// Note Category Dropdown

const categoryDropdown = document.querySelector(".note-category-dropdown");
const categoryButton = document.querySelector(".category-select-button");
const categoryOptions = document.querySelectorAll(".category-option");

const selectedIcon = document.querySelector(
    ".selected-category .category-icon"
);

const selectedName = document.querySelector(
    ".selected-category .category-text2 span"
);

const selectedDescription = document.querySelector(
    ".selected-category .category-text2 small"
);


let selectedNoteCategory = "hardware";


// Open / Close dropdown

categoryButton.addEventListener("click", (e) => {

    e.stopPropagation();

    categoryDropdown.classList.toggle("open");

});


// Select category

categoryOptions.forEach(option => {

    option.addEventListener("click", () => {


        const icon = option.querySelector(".category-icon");

        const name = option.querySelector("span").textContent;

        const description = option.querySelector("small").textContent;


        // Update selected display

        selectedIcon.innerHTML = icon.innerHTML;

        selectedName.textContent = name;

        selectedDescription.textContent = description;



        // Copy category class

        selectedIcon.className =
            "category-icon " +
            [...icon.classList]
                .filter(c => c !== "category-icon")
                .join(" ");



        // Save category

        selectedNoteCategory = name.toLowerCase();



        // Update active option

        categoryOptions.forEach(item => {

            item.classList.remove("active");

        });


        option.classList.add("active");



        // Close dropdown

        categoryDropdown.classList.remove("open");




    });

});


// Close when clicking outside

document.addEventListener("click", () => {

    categoryDropdown.classList.remove("open");

});


// Prevent dropdown from closing when clicking inside

categoryDropdown.addEventListener("click", (e) => {

    e.stopPropagation();

});
function setupSidebarDrag() {
    const sidebarBlocks = document.querySelectorAll(".sidebar-list .ai-model-sidebar-block");
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

        if (block.children[1].innerHTML != "Break") {
            let endPort = document.createElement("div")
            endPort.classList.add('ai-mini-port-row')
            endPort.innerHTML = `
        <span class="ai-mini-port-label">Next Node</span>
        <span class="ai-mini-port-dot any"></span>
        `
            block.children[0].lastElementChild.appendChild(endPort)
        }


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
                    let id = self.crypto.randomUUID()
                    clone.id = id
                    makeCanvasBlockDraggable(clone, canvas);
                    nodeGraph.nodes.push(
                        new nodeGraphItem(
                            block.children[1].innerHTML,
                            id,
                            [],
                            [],
                            [parseInt(clone.style.left), parseInt(clone.style.top)]
                        )
                    )
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


        let shiftedNodeIndex = nodeGraph.nodes.findIndex((node) => {
            return node.id == block.id
        })
        let xChange = parseInt(block.style.left) - nodeGraph.nodes[shiftedNodeIndex].position[0]
        let yChange = parseInt(block.style.top) - nodeGraph.nodes[shiftedNodeIndex].position[1]

        if (Math.abs(xChange) > 0 || Math.abs(yChange) > 0) {
            nodeGraph.nodes[shiftedNodeIndex].position = [parseInt(block.style.left), parseInt(block.style.top)]
            nodeGraph.connections.forEach((connectedNode) => {
                if (connectedNode.toNode == block.id || connectedNode.fromNode == block.id) {
                    document.querySelector('.connections').removeChild(document.getElementById(connectedNode.id))
                    //toNode is e-node
                    if (connectedNode.toNode == block.id) {

                        createConnection(
                            getSocketPosition(connectedNode.pos[0]),
                            {
                                x: getSocketPosition(connectedNode.pos[1]).x - xChange,
                                y: getSocketPosition(connectedNode.pos[1]).y - yChange

                            },
                            connectedNode.id
                        );
                    } else if (connectedNode.fromNode == block.id) {

                        createConnection(
                            {
                                x: getSocketPosition(connectedNode.pos[0]).x - xChange,
                                y: getSocketPosition(connectedNode.pos[0]).y - yChange

                            },
                            getSocketPosition(connectedNode.pos[1]),
                            connectedNode.id
                        );
                    }

                }
            })
        }


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
    document.querySelectorAll(".connection-line").forEach((el) => {
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
    document.querySelectorAll(".inspector-row").forEach((child) => {
        try {
            document.querySelector(".inspector-section").removeChild(child)
        } catch {
            document.getElementById("outputHolder").removeChild(child)
        }
    })
    let nodeInfo = nodeLibrary.find((item) => {
        return item.name == node.lastElementChild.innerHTML
    })

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

}
function closeDocs() {
    document.querySelector(".studio-main").style.gridTemplateColumns = "360px auto 0px"
    document.querySelectorAll(".inspector-row").forEach((child) => {
        try {
            document.querySelector(".inspector-section").removeChild(child)
        } catch {
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

    clone.style.left = `${currentLeft + 30}px`;
    clone.style.top = `${currentTop + 30}px`;
    clone.id = self.crypto.randomUUID()
    nodeGraph.nodes.push(
        new nodeGraphItem(
            clone.children[1].innerHTML,
            clone.id,
            [],
            [],
            [parseInt(clone.style.left), parseInt(clone.style.top)]
        )
    )
    node.parentElement.appendChild(clone);

    attachNodeContextMenu(clone)

    let canvas = document.getElementById("codingCanvas")
    makeCanvasBlockDraggable(clone, canvas);

}

function deleteNode(node) {
    let activeConnection;
    let i = 0
    for (i = 0; i < nodeGraph.connections.length; i++) {
        con = nodeGraph.connections[i]
        if (con.toNode == node.id || con.fromNode == node.id) {
            document.querySelector('.connections').removeChild(document.getElementById(con.id))
            nodeGraph.connections.splice(i, 1);
            i--;
        }
    }
    nodeGraph.nodes.splice(nodeGraph.nodes.findIndex((nodeItem) => {
        return nodeItem.id == node.id
    }), 1)
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
function createConnection(start, end, id) {


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

    let curve = -120;
    if (endX > startX) {
        curve *= -1
    }



    const d = `
        M ${startX} ${startY}

        C 
        ${startX + curve} ${startY},
        ${endX - curve} ${endY},
        ${endX} ${endY}
    `;



    path.setAttribute("d", d);
    path.id = id

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
document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("ai-mini-port-dot")) {
        if (activeNode != null) {
            activeNode.style.boxShadow = "";
            activeNode.style.borderRadius = "100px"
            activeNode = null;
        }
        return;
    }
    const el = e.target;



    if (activeNode == null) {

        activeNode = el;
        el.style.borderRadius = "4px"
        el.style.boxShadow =
            "0px 0px 10px #38BDF8";

    }

    else {
        if (e.target.parentNode.parentNode.classList[0] != activeNode.parentNode.parentNode.classList[0] && e.target.parentNode.parentNode.parentNode.parentNode.id != activeNode.parentNode.parentNode.parentNode.parentNode.id && !activeNode.classList.contains("any") && !e.target.classList.contains("any")) {
            let acceptedInputTypes;
            let acceptedOutTypes;

            if (e.target.parentNode.parentNode.classList[0] == "ai-model-sidebar-left") {
                let nodeBook = nodeLibrary.find((node) => {
                    return node.name == e.target.parentNode.parentNode.parentNode.parentNode.children[1].innerHTML
                })
                nodeBook = nodeBook.inputValues.find((input) => {
                    return input.input == e.target.parentNode.children[1].innerHTML
                })
                fromSocket = nodeBook.input
                acceptedInputTypes = nodeBook.acceptedTypes

                nodeBook = nodeLibrary.find((node) => {
                    return node.name == activeNode.parentNode.parentNode.parentNode.parentNode.children[1].innerHTML
                })
                nodeBook = nodeBook.outputValues.find((output) => {
                    return output.output == activeNode.parentNode.children[0].innerHTML
                })
                toSocket = nodeBook.output
                acceptedOutTypes = nodeBook.outputType
            }
            if (e.target.parentNode.parentNode.classList[0] == "ai-model-sidebar-right") {
                let nodeBook = nodeLibrary.find((node) => {
                    return node.name == activeNode.parentNode.parentNode.parentNode.parentNode.children[1].innerHTML
                })

                nodeBook = nodeBook.inputValues.find((input) => {
                    return input.input == activeNode.parentNode.children[1].innerHTML
                })
                fromSocket = nodeBook.input
                acceptedInputTypes = nodeBook.acceptedTypes

                nodeBook = nodeLibrary.find((node) => {
                    return node.name == e.target.parentNode.parentNode.parentNode.parentNode.children[1].innerHTML
                })
                nodeBook = nodeBook.outputValues.find((output) => {
                    return output.output == e.target.parentNode.children[0].innerHTML
                })
                toSocket = nodeBook.output
                acceptedOutTypes = nodeBook.outputType
            }

            let acceptible = false;
            acceptedOutTypes.forEach((item) => {
                console.log(acceptedInputTypes)
                console.log(item)
                console.log(acceptedInputTypes.indexOf("<br>" + item))
                console.log(item.slice(item.indexOf(">"), item.length))
                if (acceptedInputTypes.indexOf(item) != -1) {
                    acceptible = true;
                } else if (acceptedInputTypes.indexOf("<br>" + item) != -1) {
                    acceptible = true;
                } else if (acceptedInputTypes.indexOf(item.slice(item.indexOf(">") + 1, item.length)) != -1) {
                    acceptible = true
                }
            })

            if (acceptible) {
                let connected = new connection(self.crypto.randomUUID(), e.target.parentNode.parentNode.parentNode.parentNode.id, activeNode.parentNode.parentNode.parentNode.parentNode.id, [activeNode, el], fromSocket, toSocket)
                nodeGraph.connections.push(connected)
                createConnection(
                    getSocketPosition(activeNode),
                    getSocketPosition(el),
                    connected.id
                );
            } else {
                throwConnectionError(e.target, activeNode)
            }


            activeNode.style.boxShadow = "";
            activeNode.style.borderRadius = "100px"
            activeNode = null;
        } else if (activeNode.classList.contains("any") && e.target.classList.contains("any") && e.target.parentNode.parentNode.classList[0] != activeNode.parentNode.parentNode.classList[0] && e.target.parentNode.parentNode.parentNode.parentNode.id != activeNode.parentNode.parentNode.parentNode.parentNode.id) {
            if (e.target.parentNode.parentNode.classList[0] == "ai-model-sidebar-left" && (activeNode.parentNode.children[0].innerHTML == "Next Node" && e.target.parentNode.children[1].innerHTML == "Universal Connector") || (activeNode.parentNode.children[0].innerHTML == "On Program Start" && e.target.parentNode.children[1].innerHTML == "Universal Connector") || (activeNode.parentNode.children[0].innerHTML == "Do" && e.target.parentNode.children[1].innerHTML == "Universal Connector")) {
                let fromSocket = e.target.parentNode.children[1].innerHTML;
                let toSocket = activeNode.parentNode.children[0].innerHTML;
                let connected = new connection(self.crypto.randomUUID(), e.target.parentNode.parentNode.parentNode.parentNode.id, activeNode.parentNode.parentNode.parentNode.parentNode.id, [activeNode, el], fromSocket, toSocket)
                nodeGraph.connections.push(connected)
                createConnection(
                    getSocketPosition(activeNode),
                    getSocketPosition(el),
                    connected.id
                );
            }
            if (e.target.parentNode.parentNode.classList[0] == "ai-model-sidebar-right" && (activeNode.parentNode.children[1].innerHTML == "Universal Connector" && e.target.parentNode.children[0].innerHTML == "Next Node") || (activeNode.parentNode.children[1].innerHTML == "Universal Connector" && e.target.parentNode.children[0].innerHTML == "On Program Start") || (activeNode.parentNode.children[1].innerHTML == "Universal Connector" && e.target.parentNode.children[0].innerHTML == "On Data Loaded") || (activeNode.parentNode.children[1].innerHTML == "Universal Connector" && e.target.parentNode.children[0].innerHTML == "Do")) {
                let fromSocket = activeNode.parentNode.children[1].innerHTML;
                let toSocket = e.target.parentNode.children[0].innerHTML;
                let connected = new connection(self.crypto.randomUUID(), e.target.parentNode.parentNode.parentNode.parentNode.id, activeNode.parentNode.parentNode.parentNode.parentNode.id, [activeNode, el], fromSocket, toSocket)
                nodeGraph.connections.push(connected)
                createConnection(
                    getSocketPosition(activeNode),
                    getSocketPosition(el),
                    connected.id
                );
            }

        }
    }

});
class connection {
    constructor(id, toNode, fromNode, pos, fromSocket, toSocket) {
        this.id = self.crypto.randomUUID()
        this.toNode = toNode
        this.fromNode = fromNode
        this.pos = pos
        this.fromSocket = fromSocket
        this.toSocket = toSocket
    }
}
function throwConnectionError(port1, port2) {
    activeNode.style.borderRadius = "100px"
    let output
    let input
    document.getElementById("connectionPopup").style.display = "flex"
    if (port2.parentElement.parentElement.classList.contains("ai-model-sidebar-right")) {
        input = port2.parentElement
        output = port1.parentElement
    } else {
        input = port1.parentElement
        output = port2.parentElement
    }
    document.getElementById("errorInput").innerHTML = output.children[1].innerText
    document.getElementById("errorOutput").innerHTML = input.children[0].innerText
    document.getElementById("outputNodeName").innerHTML = input.parentElement.parentElement.parentElement.children[1].innerHTML
    document.getElementById("inputNodeName").innerHTML = output.parentElement.parentElement.parentElement.children[1].innerHTML
}

