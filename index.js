let currentBox = "WeeklyLogs"
document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll(".tab").forEach((Element, id)=>{
    
        Element.addEventListener("click",()=>{
            if(!Element.classList.contains("selected")){
                document.querySelector(".selected").classList.remove("selected")
                Element.classList.add("selected")
                document.getElementById(currentBox).style.display = "none"
                if(id == 0){
                    currentBox = "WeeklyLogs"
                }
                if(id == 1){
                    currentBox = "ProjectFiles"
                }
                if(id == 2){
                    currentBox = "Updates"
                }
                if(id == 3){
                    currentBox = "DemosandTutorials"
                }
                document.getElementById(currentBox).style.display = "flex"
                
            }
        })
    })

    document.getElementById("play").addEventListener("click",()=>{
        throwMessage("Demo is not ready yet, Great things take time")
    })

    document.querySelector(".majorButton").addEventListener("click",()=>{
        throwMessage("Studio is under development, Great things take time")
    })
})

function throwMessage(Message, error=true){
    if(error){
        document.getElementById("errorBox").style.backgroundColor = "#FF4D4D"
    }else{
         document.getElementById("errorBox").style.backgroundColor = "#34D399"
    }
    document.getElementById("message").innerHTML = Message
    document.getElementById("errorBox").style.transform = `translateX(-4px)`
    setTimeout(()=>{
        document.getElementById("errorBox").style.transform = `translateX(100px)`
        document.getElementById("message").innerHTML = ""
    },5000)

}