function login(){

let user=document.getElementById("user").value
let pass=document.getElementById("pass").value

if(user=="fondateur" && pass=="midnight"){

localStorage.setItem("role","fondateur")
window.location="panel.html"

}

else if(user=="cofondateur"){

localStorage.setItem("role","cofondateur")
window.location="panel.html"

}

else if(user=="dev"){

localStorage.setItem("role","dev")
window.location="panel.html"

}

else{

alert("Mauvais identifiants")

}

}
