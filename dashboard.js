let projects = window.localStorage.getItem("projects");

if (projects != null) {
    let projectList = JSON.parse(projects);
    console.log(projectList.length)
    document.getElementById("projectCount").innerHTML = projectList.length + (projectList.length > 1 || projectList.length == 0 ? " Projects" : " Project")
    if (projectList.length > 0) {
        for (i = projectList.length - 1; i >= 0; i--) {
            let e = projectList[i]
            let project = JSON.parse(e);
            let projectContainer = document.createElement("div")
            projectContainer.id = project.id
            projectContainer.classList.add('project')
            projectContainer.innerHTML = `
                        <div class="project-top">
                            <div class="project-icon">
                                ${project.icon}
                            </div>
                            <div class="status">
                                ● Active
                            </div>
                        </div>
                        <div class="project-info">
                            <h3>${project.name}</h3>
                            <p>
                                ${project.description}
                            </p>
                        </div>
                        <div class="project-footer">
                            <button class="open-btn" id=${project.id}OpenButton>
                                Open Project
                            </button>
                            <button class="delete-btn" id=${project.id}DeleteButton>
                                Delete
                            </button>
                        </div>`
            document.getElementById("projectGrid").appendChild(projectContainer)
            document.getElementById(`${project.id}OpenButton`).addEventListener("click", () => {
                window.location.assign(`studio.html?projectId=${encodeURIComponent(project.id)}`);
            })
        }
        
    }
}

document.getElementById("create-btn").addEventListener("click", () => {
    document.getElementById("newProjectModal").style.display = "flex"
    document.getElementById("cancel-btn").addEventListener("click", () => {
        document.getElementById("newProjectModal").style.display = "none"
    })
    document.getElementById("create-project-btn").addEventListener("click", () => {
        let username = document.getElementById("projectName").value
        if (username.trim().length == 0) {
            if (projects == null) {
                username = "Inventa Project #1"
            } else {
                username = "Inventa Project #" + JSON.parse(projects).length
            }
        }
        let description = document.getElementById("des").value
        if (description.trim().length == 0) {
            description = "An Inventa Project"
        }
        let icon = document.querySelector(".selected").innerHTML
        let completedCompilation = new project(username, description, icon)
        if (projects == null) {
            projects = [];
            projects.push(JSON.stringify(completedCompilation));
            projects = JSON.stringify(projects)
            window.localStorage.setItem("projects", projects)
        } else {
            projects = JSON.parse(projects);
            projects.push(JSON.stringify(completedCompilation));
            projects = JSON.stringify(projects)
            window.localStorage.setItem("projects", projects)
        }
        window.location.assign("studio.html")

    })
    document.querySelectorAll(".icon").forEach((child) => {
        child.addEventListener("click", () => {
            if (!child.classList.contains("selected")) {
                document.querySelector(".selected").classList.remove("selected")
                child.classList.add("selected")
            }
        })
    })

})
class project {
    constructor(name, description, icon, id) {
        this.id = self.crypto.randomUUID()
        this.name = name
        this.description = description
        this.icon = icon
    }
}