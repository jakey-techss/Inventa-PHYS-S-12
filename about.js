let currentBox = "Projects"
document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll(".tab").forEach((Element, id)=>{
    
        Element.addEventListener("click",()=>{
            if(!Element.classList.contains("selected")){
                document.querySelector(".selected").classList.remove("selected")
                Element.classList.add("selected")
                document.getElementById(currentBox).style.display = "none"
                if(id == 0){
                    currentBox = "Projects"
                }
                if(id == 1){
                    currentBox = "Skills"
                }
                if(id == 2){
                    currentBox = "Hobbies"
                }

                document.getElementById(currentBox).style.display = "flex"
                
            }
        })
    })
})