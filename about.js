let currentBox = "Projects";

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".tabPanel");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.target;
            if (!target || tab.classList.contains("selected")) return;

            document.querySelector(".tab.selected")?.classList.remove("selected");
            tab.classList.add("selected");

            panels.forEach((panel) => panel.classList.remove("activePanel"));

            currentBox = target;
            document.getElementById(currentBox)?.classList.add("activePanel");
        });
    });
});