const HUB_URL = "ws://inventa-hub.local/ws";
let currentProjectID = new URLSearchParams(window.location.search).get("projectId");
let currentDatasetID = new URLSearchParams(window.location.search).get("datasetId");
if(currentProjectID == null || currentProjectID == undefined || currentDatasetID == undefined || currentDatasetID == null){
    window.location.assign("dashboard.html")
}
let socket;
let sensorList = []
let sum = 0;
let time = 0;
let startedTime = false;
let requestedData = false;
setInterval(() => {
    connectToHub();
}, 5000)
let Allprojects = JSON.parse(window.localStorage.getItem("projects"))
let project = JSON.parse(Allprojects.find((pro) => {
    return JSON.parse(pro).id == currentProjectID
}))
let projectIndex = Allprojects.findIndex((pro) => {
    return JSON.parse(pro).id == currentProjectID
})
let currentDataset = project.datasets.find((dataset) => {
    return JSON.parse(dataset).id == currentDatasetID
})
let currentDatasetIndex = project.datasets.findIndex((dataset) => {
    return JSON.parse(dataset).id == currentDatasetID
})
currentDataset = JSON.parse(currentDataset)
console.log(currentDataset)
document.getElementById("dataset-name").innerText = currentDataset.name
document.getElementById("sampleRate").innerText = currentDataset.sampleRate + " Hz"
document.getElementById("collectionMode").innerText = currentDataset.CaptureMode.substring(0, 1).toUpperCase() + currentDataset.CaptureMode.substring(1)
if (currentDataset.data.length > 1) {
    sum = 0
    for (i = 1; i < currentDataset.data.length; i++) {
        if (i == 1) {
            for (j = 0; j < currentDataset.data[i].length; j++) {
                let header = document.createElement('th')
                header.innerHTML = currentDataset.data[i][j];
                document.getElementById("thead").appendChild(header)
            }
        } else {
            sum--;
            let row = document.createElement('tr')
            for (j = 0; j < currentDataset.data[i].length; j++) {
                let listItem = document.createElement('td')
                listItem.innerHTML = currentDataset.data[i][j];
                row.appendChild(listItem)
                sum++
            }
            document.getElementById("tbody").appendChild(row)
        }
    }
    document.getElementById("samples").innerHTML = sum
}
if (currentDataset.CaptureMode != "continuous") {
    document.getElementById("continuousOnly").style.display = "none"
} else {
    document.getElementById("sampleLimit").innerText = currentDataset.sampleCount
}
if (currentDataset.CaptureMode == "timed") {
    document.getElementById("capture-duration").style.display = "block"
    time = 30000
} else {
    document.getElementById("capture-duration").style.display = "none"
}
if (currentDataset.CaptureMode == "manual") {
    document.getElementById("captureButton").style.display = "flex"
    document.getElementById("sampleRateContainer").style.display = "none"
    document.getElementById("latencyCard").style.display = "none"
    document.getElementById("start").style.display = "none"
    document.getElementById("pause").style.display = "none"
} else {
    document.getElementById("captureButton").style.display = "none"
}
if (currentDataset.sensorModule == "BMP180" && currentDataset.data.length == 1) {
    let rowTitles = ["Row ID", "Temperature", "Pressure", "Altitude"]
    currentDataset.data.push(rowTitles)
    project.datasets[currentDatasetIndex] = JSON.stringify(currentDataset)
    Allprojects.splice(projectIndex, 1);
    Allprojects.push(JSON.stringify(project))
    window.localStorage.setItem("projects", JSON.stringify(Allprojects))
    Allprojects = JSON.parse(window.localStorage.getItem("projects"))
    project = JSON.parse(Allprojects.find((pro) => {
        return JSON.parse(pro).id == currentProjectID
    }))
    currentDataset = JSON.parse(project.datasets.find((dataset) => {
        return JSON.parse(dataset).id == currentDatasetID
    }))
    for (i = 1; i < currentDataset.data.length; i++) {
        if (i == 1) {
            for (j = 0; j < currentDataset.data[i].length; j++) {
                let header = document.createElement('th')
                header.innerHTML = currentDataset.data[i][j];
                document.getElementById("thead").appendChild(header)
            }
        }
    }
}
const options = document.querySelectorAll(".duration-option");
const selected = document.getElementById("selectedDuration");


options.forEach(button => {

    button.addEventListener("click", () => {
        if (!startedTime) {
            options.forEach(b => b.classList.remove("active"));

            button.classList.add("active");

            selected.textContent = button.textContent;

            console.log(getCaptureDuration())
        } else {
            showAlert("Data Collection Already Started", "Wait for this data collection process to end or pause it to make any changes to the time domain", "error")
        }
    });

});
document.getElementById("customTime").addEventListener('change', () => {
    if (!startedTime) {
        const active = document.querySelector(".duration-option.active");
        active.classList.remove("active")
        document.getElementById("selectedDuration").innerHTML = document.getElementById("customTime").value + document.getElementById("timeUnit").value
        time = getCaptureDuration()
    } else {
        showAlert("Data Collection Already Started", "Wait for this data collection process to end or pause it to make any changes to the time domain", "error")
    }
})
document.getElementById("timeUnit").addEventListener('change', () => {
    if (!startedTime) {
        const active = document.querySelector(".duration-option.active");
        active.classList.remove("active")
        document.getElementById("selectedDuration").innerHTML = document.getElementById("customTime").value + document.getElementById("timeUnit").value
        time = getCaptureDuration()
    } else {
        showAlert("Data Collection Already Started", "Wait for this data collection process to end or pause it to make any changes to the time domain", "error")
    }
})
function getCaptureDuration() {

    const active = document.querySelector(".duration-option.active");

    if (active) {

        return Number(active.dataset.seconds);

    }

    let value = Number(document.getElementById("customTime").value);

    let unit = document.getElementById("timeUnit").value;

    switch (unit) {

        case "minutes":
            value *= 60;
            break;

        case "hours":
            value *= 3600;
            break;
    }

    return value * 1000;

}
const captureButton = document.getElementById("captureButton");

captureButton.addEventListener("click", () => {

    captureButton.classList.add("capturing");

    setTimeout(() => {

        captureButton.classList.remove("capturing");

    }, 250);

});
document.getElementById("firstprojName").innerHTML = project.name.substring(0, Math.round(project.name.length / 6))
document.getElementById("secondprojName").innerHTML = project.name.substring(Math.round(project.name.length / 6), project.name.length - Math.round(project.name.length / 4))
document.getElementById("LastprojName").innerHTML = project.name.substring(project.name.length - Math.round(project.name.length / 4), project.name.length)
if (project.datasets != null) {
    project.datasets.forEach((dataset) => {
        let datasetItem = document.createElement('div');
        datasetItem.classList.add("dataset-item")
        datasetItem.id = JSON.parse(dataset).id + "Dataset"
        if (JSON.parse(dataset).id == currentDatasetID) {
            datasetItem.classList.add("active")
        }
        datasetItem.innerHTML = `
                        <div class="dataset-icon" style="color:hsl(${Math.random() * 361},100%,${(Math.random() * 21) + 50}%);">
                            ◉
                        </div>


                        <div>

                            <h3>
                                ${JSON.parse(dataset).name}
                            </h3>

                            <p>
                                 ${JSON.parse(dataset).sensorModule}
                            </p>

                        </div>


                    </div>`
        document.querySelector('.dataset-list').appendChild(datasetItem)
        document.getElementById(datasetItem.id).addEventListener("click", () => {
            window.location.assign(`dataviewer.html?projectId=${encodeURIComponent(currentProjectID)}&datasetId=${encodeURIComponent(JSON.parse(dataset).id)}`);
        })

    })
}
document.getElementById("studioBtn").addEventListener("click", () => {
    window.location.assign(`studio.html?projectId=${encodeURIComponent(currentProjectID)}`);
})
document.getElementById("dashboardHome").addEventListener("click", () => {
    window.location.assign(`data.html?projectId=${encodeURIComponent(currentProjectID)}`);
})
function connectToHub() {
    socket = new WebSocket(HUB_URL);

    socket.onerror = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#FF4D4D";
        document.getElementById("hubStatus").innerHTML = `Hub Failed To Connect`;
    };

    socket.onopen = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#34D399";
        document.getElementById("hubStatus").innerHTML = `Hub Ready`;
    };

    socket.onmessage = (message) => {
        console.log(message.data)
        if (message.data.indexOf("BMP180 Detected") != -1) {
            if (sensorList.indexOf("BMP180") == -1) {
                sensorList.splice(sensorList.indexOf("BMP180"), 1)
                sensorList.push("BMP180")
                document.querySelectorAll(".SensorModules").forEach((m) => {
                    sensorList.forEach((sensor) => {
                        let option = document.createElement("option")
                        option.innerHTML = sensor
                        option.value = sensor
                        m.appendChild(option)
                    })

                })
                if (currentDataset.sensorModule == "BMP180") {
                    let info = document.querySelector(".static")
                    info.innerHTML = " ● Sensor Ready"
                    info.classList.remove("static")
                    info.classList.add("ready")
                }
            }

        } else if (message.data == "BMP180 Not Found") {
            if (sensorList.indexOf("BMP180") != -1) {
                sensorList.splice(sensorList.indexOf("BMP180"), 1)
                let info = document.querySelector(".ready")
                info.innerHTML = " ● Sensor Not Found"
                info.classList.remove("ready")
                info.classList.add("recording")
            }
        }
        if (message.data.indexOf("{") != -1) {
            if (requestedData) {
                createRow(message.data)
                requestedData = false
            }
        }

        if (sensorList.length > 0) {
            document.querySelector(".new-dataset").addEventListener("click", () => {
                document.getElementById("datasetModal").style.display = "flex"
            })
        } else {
            document.querySelector(".new-dataset").removeEventListener("click", () => {
                document.getElementById("datasetModal").style.display = "flex"
            })
        }
    }
}

function createRow(message) {
    let newRow = [currentDataset.data.length - 1, message.substring(message.indexOf(":") + 1, message.indexOf(",")), message.substring(message.indexOf(":", message.indexOf(":") + 1) + 1, message.indexOf(",", message.indexOf(",") + 1)), message.substring(message.indexOf("Altitude") + 8)]
    currentDataset.data.push(newRow)
    project.datasets[currentDatasetIndex] = JSON.stringify(currentDataset)
    Allprojects.splice(projectIndex, 1);
    Allprojects.push(JSON.stringify(project))
    window.localStorage.setItem("projects", JSON.stringify(Allprojects))
    Allprojects = JSON.parse(window.localStorage.getItem("projects"))
    project = JSON.parse(Allprojects.find((pro) => {
        return JSON.parse(pro).id == currentProjectID
    }))
    currentDataset = JSON.parse(project.datasets.find((dataset) => {
        return JSON.parse(dataset).id == currentDatasetID
    }))
    console.log(currentDataset)
    sum -= 1
    for (i = currentDataset.data.length - 1; i < currentDataset.data.length; i++) {
        let row = document.createElement('tr')
        for (j = 0; j < currentDataset.data[i].length; j++) {
            let listItem = document.createElement('td')
            listItem.innerHTML = currentDataset.data[i][j];
            row.appendChild(listItem)
            sum++
        }
        document.getElementById("tbody").appendChild(row)
    }
    document.getElementById("samples").innerHTML = sum
}
document.getElementById("start").addEventListener("click", () => {
    if (sensorList.indexOf(currentDataset.sensorModule) != -1) {
        if (!requestedData && currentDataset.CaptureMode == "timed") {


            requestedData = true;
            startedTime = true;
            let info = document.querySelector(".ready")
            let intenalTime = time
            info.innerHTML = " ● Receiving"
            info.classList.remove("ready")
            info.classList.add("recording")
            for (i = 0; i < 1; i++) {
                intenalTime = time
                let timer = window.setInterval(() => {
                    if (intenalTime > 0) {

                        if (socket.readyState === WebSocket.OPEN) {
                            requestedData = true;
                            socket.send(currentDataset.sensorModule + "sendData")
                            intenalTime -= 1000
                        }

                    }
                }, 1000)

                if (intenalTime <= 0) {
                    showAlert("Data Collection Complete", "Data collection has be completed sucessfully", "success")
                    clearInterval(timer)
                }
            }
            
        }
        if (!requestedData && currentDataset.CaptureMode == "continuous") {


            requestedData = true;
            startedTime = true;
            let interval = 500
            let factor = parseInt(currentDataset.sampleCount)/300
            let info = document.querySelector(".ready")
            let time = 10000*factor
            let intenalTime = time
            let j = 0
            info.innerHTML = " ● Receiving"
            info.classList.remove("ready")
            info.classList.add("recording")
            for (i = 0; i < 1; i++) {
                intenalTime = time
                let timer = window.setInterval(() => {
                    if (intenalTime > 0) {

                        if (socket.readyState === WebSocket.OPEN) {
                            requestedData = true;
                            socket.send(currentDataset.sensorModule + "sendData")
                            intenalTime -= 100
                        }

                    }
                }, 1000)

                if (intenalTime <= 0) {
                    showAlert("Data Collection Complete", "Data collection has be completed sucessfully", "success")
                    clearInterval(timer)
                }
            }
            
        }

    } else {
        showAlert("Unable To Start Data Collection", "We were unable to collect data from the sensor associated with this data set. Ensure that the sensor is plugged in properly and, ensure to look for the 'sensor ready' sign", "error")
    }
})
document.getElementById("captureButton").addEventListener("click", () => {

    if (sensorList.indexOf(currentDataset.sensorModule) != -1) {
        if (socket.OPEN == 1 && !requestedData) {
            socket.send(currentDataset.sensorModule + "sendData")
            requestedData = true;
            let info = document.querySelector(".static")
            info.innerHTML = " ● Receiving"
            info.classList.remove("static")
            info.classList.add("recording")
        }

    } else {
        showAlert("Unable To Collect Data", "We were unable to collect data from the sensor associated with this data set. Ensure that the sensor is plugged in properly and, ensure to look for the 'sensor ready' sign", "error")
    }
})

document.querySelector(".cancel-button").addEventListener("click", () => {
    document.getElementById("datasetModal").style.display = "none"
})
document.querySelector(".close-modal").addEventListener("click", () => {
    document.getElementById("datasetModal").style.display = "none"
})

document.getElementById("record-button2").addEventListener("click", () => {
    let name = document.querySelector(".modal-body input[type='text']").value
    if (name.trim() == "") {
        name = "Dataset"
    }
    let sensor = document.querySelector(".modal-body .SensorModules").value
    let CaptureMode = document.querySelector(".modal-body .CaptureMode").value
    let sampleRate = "Undefined"
    let sampleCount = "Undefined"
    if (document.querySelector(".modal-body .CaptureMode").value != "manual") {
        sampleRate = document.querySelector(".modal-body .SampleRate").value
    }
    if (document.querySelector(".modal-body .CaptureMode").value == "continuous") {
        sampleCount = document.querySelector(".modal-body .SampleCount").value
    }
    let project = JSON.parse(window.localStorage.getItem("projects"))
    project = JSON.parse(project.find((pro) => {
        return JSON.parse(pro).id == currentProjectID
    }))

    let projectindex = JSON.parse(window.localStorage.getItem("projects")).findIndex((pro) => {
        return JSON.parse(pro).id == currentProjectID
    })

    if (project.datasets == null || project.datasets == undefined) {
        let datasets = [];
        let dataObject = new data(name, sensor, CaptureMode, sampleCount, sampleRate, [[]], self.crypto.randomUUID())
        datasets.push(JSON.stringify(dataObject))
        project.datasets = datasets

    } else {
        let datasets = project.datasets;
        let dataObject = new data(name, sensor, CaptureMode, sampleCount, sampleRate, [[]], self.crypto.randomUUID())
        datasets.push(JSON.stringify(dataObject))
        project.datasets = datasets
    }
    if (project.dataLogs == null || project.dataLogs == undefined) {
        let dataLogs = [];
        let dataLogObject = new dataLog(new Date().toDateString(), `Created ${name} dataset`, new Date().toTimeString())
        dataLogs.push(JSON.stringify(dataLogObject))
        project.dataLogs = dataLogs

    } else {
        let dataLogs = project.dataLogs;
        let dataLogObject = new dataLog(new Date().toDateString(), `Created ${name} dataset`, new Date().toTimeString())
        dataLogs.push(JSON.stringify(dataLogObject))
        project.dataLogs = dataLogs
    }

    let Updatedproject = JSON.parse(window.localStorage.getItem("projects"))
    Updatedproject.splice(projectindex, 1);
    Updatedproject.push(JSON.stringify(project))
    window.localStorage.setItem("projects", JSON.stringify(Updatedproject))
    project = JSON.parse(window.localStorage.getItem("projects"))
    project = JSON.parse(project.find((pro) => {
        return JSON.parse(pro).id == currentProjectID
    }))

    let dataset = project.datasets[project.datasets.length - 1]
    let datasetItem = document.createElement('div');
    datasetItem.classList.add("dataset-item")
    datasetItem.id = JSON.parse(dataset).id + "Dataset"
    datasetItem.innerHTML = `
                        <div class="dataset-icon" style="color:hsl(${Math.random() * 361},100%,${(Math.random() * 21) + 50}%);">
                            ◉
                        </div>


                        <div>

                            <h3>
                                ${JSON.parse(dataset).name}
                            </h3>

                            <p>
                                 ${JSON.parse(dataset).sensorModule}
                            </p>

                        </div>


                    </div>`
    document.querySelector('.dataset-list').appendChild(datasetItem)

    document.getElementById(datasetItem.id).addEventListener("click", () => {
        window.location.assign(`dataviewer.html?projectId=${encodeURIComponent(currentProjectID)}&datasetId=${encodeURIComponent(JSON.parse(dataset).id)}`);
    })

    document.getElementById("datasetModal").style.display = "none"

})
document.querySelector(".modal-body .CaptureMode").addEventListener("change", () => {
    if (document.querySelector(".modal-body .CaptureMode").value == "continuous") {
        document.querySelector(".specialSample").style.display = "flex";
    } else {
        document.querySelector(".specialSample").style.display = "none";
    }
    if (document.querySelector(".modal-body .CaptureMode").value == "manual") {
        document.querySelector(".notManual").style.display = "none";
    } else {
        document.querySelector(".notManual").style.display = "flex";
    }
})

class data {
    constructor(name, sensorModule, CaptureMode, sampleCount, sampleRate, data, id) {
        this.name = name;
        this.sensorModule = sensorModule;
        this.CaptureMode = CaptureMode;
        this.sampleCount = sampleCount;
        this.sampleRate = sampleRate;
        this.data = data;
        this.id = id;
    }
}
const alertBox = document.getElementById("inventaAlert");
const alertTitle = document.getElementById("alertTitle");
const alertMessage = document.getElementById("alertMessage");
const alertIcon = document.getElementById("alertIcon");


function showAlert(title, message, type = "success") {

    alertTitle.textContent = title;
    alertMessage.textContent = message;


    if (type === "success") {

        alertIcon.className =
            "fa-solid fa-circle-check";

    }


    if (type === "error") {

        alertIcon.className =
            "fa-solid fa-circle-xmark";

    }


    if (type === "warning") {

        alertIcon.className =
            "fa-solid fa-triangle-exclamation";

    }


    if (type === "info") {

        alertIcon.className =
            "fa-solid fa-circle-info";

    }


    alertBox.classList.add("show");


    setTimeout(() => {

        closeAlert();

    }, 4000);

}



function closeAlert() {

    alertBox.classList.remove("show");

}
class dataLog {
    constructor(time, log, exactTime) {
        this.time = time;
        this.log = log;
        this.exactTime = exactTime
    }
}


