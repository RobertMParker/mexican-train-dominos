

const outputHeader = document.querySelector("#createOutput");
const handSizeTextField = document.querySelector("#handSize");
const maxDoubleTextField = document.querySelector("#maxDouble");
const usernamesTextField = document.querySelector("#usernames");
const createButton = document.querySelector("#createButton");

createButton.addEventListener("click", function(){
  var usernames = usernamesTextField.value.split(",");
  for (var i=0; i<usernames.length; i++) {
    usernames[i] = usernames[i].trim();
  }
  
  var gamestate = new Gamestate(null, null);
  gamestate.setMaxDouble(parseInt(maxDoubleTextField.value));
  gamestate.setHandSize(parseInt(handSizeTextField.value));
  gamestate.resetInternal(usernames);
  if (!gamestate.valid) {
    console.log("gamestate isn't valid...");
    return;
  }
  
  var db = firebase.firestore();
  db.collection("games").add({
    gamestate: gamestate.toJSONString(),
  })
  .then(function(docRef) {
    console.log("Document written with ID: ", docRef.id);
    outputHeader.innerHTML = generateGameLinkHtml(docRef.id, usernames);
  })
  .catch(function(error) {
    console.log("Error adding document: ", error);
    outputHeader.innerHTML = "<b>Error creating game!</b>"
  });
});


function generateGameLinkHtml(gameId, usernames) {
  var orig = window.location.href;
  // remove any URL parameters
  orig = orig.split('?')[0];
  var url;
  if (orig.endsWith("index.html")) {
    url = orig.replace("index.html", "play.html");
  } else {
    url = orig + "play.html";
  }
  var result = "<b>Email these links to your crew, everyone should use a separate link with their name</b><br>";
  for (var i=0; i<usernames.length; i++) {
    result += url + "?gameId=" + gameId + "&user=" + usernames[i] + "<br>";
  }
  return result;
}





