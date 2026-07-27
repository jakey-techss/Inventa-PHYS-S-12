const HUB_URL = "ws://inventa-hub.local/ws";
let currentProjectID = new URLSearchParams(window.location.search).get("projectId");
if(currentProjectID == null || currentProjectID == undefined){
    window.location.assign("dashboard.html")
}
let socket;
let sensorList = []
let sum = 0;
connectToHub();
setInterval(() => {
    connectToHub();
}, 60000)
let project = JSON.parse(window.localStorage.getItem("projects"))
project = JSON.parse(project.find((pro) => {
    return JSON.parse(pro).id == currentProjectID
}))

if(project.datasets != undefined){
for (k = 0; k < project.datasets.length; k++) {
    let currentDataset = JSON.parse(project.datasets[k])
    if (currentDataset.data.length > 1) {
        
        for (i = 2; i < currentDataset.data.length; i++) {
                sum--;
                for (j = 0; j < currentDataset.data[i].length; j++) {
                    sum++
                }
                
        }
        document.getElementById("samples").innerHTML = sum
    }
}}
document.getElementById("firstprojName").innerHTML = project.name.substring(0, Math.round(project.name.length / 6))
document.getElementById("secondprojName").innerHTML = project.name.substring(Math.round(project.name.length / 6), project.name.length - Math.round(project.name.length / 4))
document.getElementById("LastprojName").innerHTML = project.name.substring(project.name.length - Math.round(project.name.length / 4), project.name.length)
if (project.datasets != null) {
    document.getElementById("numDatasets").innerHTML = project.datasets.length
    project.datasets.forEach((dataset) => {
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
    })
}
if (project.dataLogs != null) {
    for (i = project.dataLogs.length - 1; i >= 0; i--) {
        let datalog = project.dataLogs[i]
        let datalogItem = document.createElement('div');
        datalogItem.classList.add("timeline-item")
        datalogItem.innerHTML = `<span></span>


                            <div>

                                <h4>
                                    ${JSON.parse(datalog).log}
                                </h4>

                                <p>
                                     ${JSON.parse(datalog).time} • ${JSON.parse(datalog).exactTime}
                                </p>

                            </div>
`
        document.querySelector('.timeline').appendChild(datalogItem)

    }
}
document.getElementById("studioBtn").addEventListener("click", () => {
    window.location.assign(`studio.html?projectId=${encodeURIComponent(currentProjectID)}`);
})
function connectToHub() {
    socket = new WebSocket(HUB_URL);

    socket.onerror = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#FF4D4D";
        document.getElementById("hubStatus").innerHTML = `Hub Connection Failed`;
    };

    socket.onopen = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#34D399";
        document.getElementById("hubStatus").innerHTML = `Hub Ready`;
    };

    socket.onmessage = (message) => {
        console.log(message.data)
        if (message.data.indexOf("BMP180 Detected") != -1) {
            if (sensorList.indexOf("BMP180") == -1) {
                let BMPSensor = document.createElement('div')
                BMPSensor.classList.add('sensor-card')
                BMPSensor.id = "BMP180"
                BMPSensor.innerHTML = `<div class="sensor-title">
                                        <span></span>
                                        BMP Sensor
                                    </div>
                                    <h2>
                                        ${message.data.substring(16)}&#176;C
                                    </h2>
                                    <p>
                                        I2C Address: 0x77
                                    </p>

`
                document.querySelector('.sensor-grid').appendChild(BMPSensor)
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
            }

        } else if (message.data == "BMP180 Not Found") {
            if (sensorList.indexOf("BMP180") != -1) {

                sensorList.splice(sensorList.indexOf("BMP180"), 1)
                document.querySelector('.sensor-grid').removeChild(document.getElementById("BMP180"))

            }
        }
        document.getElementById("sensorListCount").innerHTML = sensorList.length
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

    let datalog = project.dataLogs[project.dataLogs.length - 1]
    let datalogItem = document.createElement('div');
    datalogItem.classList.add("timeline-item")
    datalogItem.innerHTML = `<span></span>


                            <div>

                                <h4>
                                    ${JSON.parse(datalog).log}
                                </h4>

                                <p>
                                     ${JSON.parse(datalog).time} • ${JSON.parse(datalog).exactTime}
                                </p>

                            </div>
`
    document.querySelector('.timeline').appendChild(datalogItem)
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
class dataLog {
    constructor(time, log, exactTime) {
        this.time = time;
        this.log = log;
        this.exactTime = exactTime
    }
}

