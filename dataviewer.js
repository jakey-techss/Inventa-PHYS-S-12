const HUB_URL = "ws://inventa-hub.local/ws";
let currentProjectID = new URLSearchParams(window.location.search).get("projectId");
let currentDatasetID = new URLSearchParams(window.location.search).get("datasetId");
let socket;
let sensorList = []
setInterval(() => {
    connectToHub();
}, 5000)
let project = JSON.parse(window.localStorage.getItem("projects"))
project = JSON.parse(project.find((pro) => {
    return JSON.parse(pro).id == currentProjectID
}))
if (project.datasets != null) {
    project.datasets.forEach((dataset) => {
        let datasetItem = document.createElement('div');
        datasetItem.classList.add("dataset-item")
        datasetItem.id = JSON.parse(dataset).id+"Dataset"
        if(JSON.parse(dataset).id == currentDatasetID){
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
        document.getElementById("hubStatus").innerHTML = `Connection Dropped`;
    };

    socket.onopen = () => {
        document.querySelector(".status-dot-hub").style.backgroundColor = "#34D399";
        document.getElementById("hubStatus").innerHTML = `Hub Ready`;
    };

    socket.onmessage = (message) => {
        console.log(message.data)
        if (message.data == "BMP180 Detected") {
            if (sensorList.indexOf("BMP180") == -1) {
                let BMPSensor = document.createElement('div')
                BMPSensor.classList.add('sensor-card')
                BMPSensor.id = "BMP180"
                BMPSensor.innerHTML = `<div class="sensor-title">
                                        <span></span>
                                        BMP Sensor
                                    </div>
                                    <h2>
                                        No Data
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

