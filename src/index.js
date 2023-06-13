let map;
let marker;
let markers = [];
let isClicked;
let mapPin;
let mapPinShowEvent;
let mapPinFocusEvent;
let showList = false;
let pesq;

/*Elements*/
let form = document.querySelector(".form-register");
let listEvents = document.querySelector(".event-list");

/*Elements form */
let coordinates = document.querySelector("#coordinates");
let inputEvent = document.querySelector("#titulo");
let descricao = document.querySelector("#descricao");
let dataInicio = document.querySelector("#dataIni");
let dataTermino = document.querySelector("#dataFim");
let searchEvent = document.querySelector("#searchEvent");

async function initMap() {
  //@ts-ignore

  const { Map } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    center: { lat: -6.88778, lng: -38.557 },
    zoom: 14,
    disableDefaultUI: true,
  });

  map.addListener("click", (event) => {
    isClicked = true;
    showForm();
    coordinates.textContent = `${event.latLng.lat()}, ${event.latLng.lng()}`;
    marker.position = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    marker.setPosition(event.latLng);
  });

  mapPin = {
    url: "./img/map-pin.svg", // url
    scaledSize: new google.maps.Size(30, 40), // scaled size
  };

  marker = new google.maps.Marker({
    // position: { lat: -6.88778, lng: -38.55700 },
    map,
    title: "Marcador",
    icon: mapPin,
  });
}

initMap();

/*Salvar*/
let buttonSave = document.querySelector("#buttonEvent");
buttonSave.addEventListener("click", async () => {
  buttonSave.textContent = "Salvar evento";
  if (inputEvent.value === "") {
    inputWarning();
  } else if (isClicked === false) {
    createMarkerWarning();
  } else {
    if (isClicked && !showList) {
      await salvar();
    }

    if (isClicked && showList) {
      await salvar();
      removeCardEvents();
      await mostrar();
    }
  }
});

searchEvent.addEventListener("keyup", async () => {
  console.log(searchEvent.value);
  clearTimeout(pesq);
  let eventos;
  if (searchEvent.value == "") {
    removeCardEvents();
    await mostrar();
  } else {
    pesq = setTimeout(async () => {
      const obj = { pesquisa: searchEvent.value };
      const response = await fetch(`http://localhost:3000/pontos/pesquisa`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(obj),
      });
      eventos = await response.json();
      console.log(eventos);
      removeCardEvents();
      for (let evento of eventos) {
        createCard(evento._id);
      }
    }, 300);
  }
});

async function salvar() {
  const obj = {
    titulo: inputEvent.value,
    descricao: descricao.value,
    lat: marker.getPosition().lat(),
    lng: marker.getPosition().lng(),
  };

  if (dataInicio.value) {
    obj.dataInicio = dataInicio.value;
  }
  if (dataTermino.value) {
    obj.dataTermino = dataTermino.value;
  }
  await fetch("http://localhost:3000/pontos", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(obj),
  })
    .then((response) => {
      sucessButton();
    })
    .catch((error) => {
      errorButton();
    });
  isClicked = false;
}

async function editar(element) {
  const response = await fetch(`http://localhost:3000/pontos/${element}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const object = await response.json();
  const obj = {
    titulo: inputEvent.value,
    descricao: descricao.value,
    dataInicio: dataInicio.value,
    dataTermino: dataTermino.value,
    lat: object.localizacao.split(" ")[1],
    lng: object.localizacao.split(" ")[0],
  };

  await fetch(`http://localhost:3000/pontos/${element}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(obj),
  })
    .then((response) => {
      sucessButton();
    })
    .catch((error) => {
      errorButton();
    });
}

async function destroy(element) {
  await fetch(`http://localhost:3000/pontos/${element}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      sucessButton();
    })
    .catch((error) => {
      errorButton();
    });
}

/*Mostrar lista*/

async function mostrar() {
  const response = await fetch("http://localhost:3000/pontos", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const eventos = await response.json();

  mapPinShowEvent = {
    url: "./img/map-pin-show-event.svg", // url
    scaledSize: new google.maps.Size(30, 40), // scaled size
  };

  mapPinFocusEvent = {
    url: "./img/map-pin-focus-event.svg", // url
    scaledSize: new google.maps.Size(30, 40), // scaled size
  };

  for (let i = eventos.length - 1; i >= 0; i--) {
    let markerSalvo = new google.maps.Marker({
      position: {
        lat: Number(eventos[i].localizacao.split(" ")[1]),
        lng: Number(eventos[i].localizacao.split(" ")[0]),
      },
      map,
      titulo: eventos[i].titulo,
      descricao: eventos[i].descricao,
      dataInicio: eventos[i].dataInicio,
      dataTermino: eventos[i].dataTermino,
      id: eventos[i]._id,
      icon: mapPinShowEvent,
    });
    createCard(eventos[i]._id);
    markers.push(markerSalvo);
  }
}

let showListButton = document.querySelector("#menuBarButton");

showListButton.addEventListener("click", () => {
  showList = true;
  listEvents.classList.remove("hide");
  mostrar();
});

let buttonExitList = document.querySelector("#exitListButton");
buttonExitList.addEventListener("click", () => {
  showList = false;
  listEvents.classList.add("hide");
  removeCardEvents();
});

function removeCardEvents() {
  while (document.querySelector(".card")) {
    // markerSalvo.setMap(null);
    let cards = document.querySelector(".cards");
    let card = document.querySelector(".card");
    cards.removeChild(card);
  }
  markers = [];
}

/*Form*/
function showForm() {
  form.classList.remove("hide");
}

let exitForm = document.querySelector("#exitForm");
exitForm.addEventListener("click", () => {
  form.classList.add("hide");
});

async function showFormEdit(element) {
  const response = await fetch(`http://localhost:3000/pontos/${element}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const object = await response.json();
  // let divButton = document.querySelector(".button-event-form");
  // if (!editing) {
  //   divButton.replaceChild(buttonChange, buttonSave);
  // }
  // editing = true;
  form.classList.remove("hide");
  // buttonChange.setAttribute("id", "buttonChange");
  buttonSave.textContent = "Salvar alterações";
  coordinates.textContent = `${object.localizacao.split(" ")[1]}, ${
    object.localizacao.split(" ")[0]
  }`;
  inputEvent.value = object.titulo;
  descricao.value = object.descricao;
  dataInicio.value = object.dataInicio.substr(0, 10);
  dataTermino.value = object.dataTermino.substr(0, 10);
  buttonSave.addEventListener("click", async () => {
    await editar(element);
    removeCardEvents();
    await mostrar();
    hideFormEdit();
  });
}

function hideFormEdit() {
  form.classList.add("hide");
}

/*Card*/
async function createCard(element) {
  const response = await fetch(`http://localhost:3000/pontos/${element}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const object = await response.json();
  let divCards = document.querySelector(".cards");

  let card = document.createElement("div");
  card.classList.add("card");
  divCards.appendChild(card);

  let cardHeader = document.createElement("div");
  cardHeader.classList.add("card-header");
  card.appendChild(cardHeader);

  let title = document.createElement("div");
  title.classList.add("card-title");
  title.textContent = object.titulo;
  cardHeader.appendChild(title);

  let cardActions = document.createElement("div");
  cardActions.classList.add("card-actions");
  cardHeader.appendChild(cardActions);

  let buttonEdit = document.createElement("button");
  buttonEdit.setAttribute("id", "editButton");
  let iconEdit = document.createElement("img");
  iconEdit.setAttribute("src", "./img/edit-button.svg");
  buttonEdit.appendChild(iconEdit);
  cardActions.appendChild(buttonEdit);

  buttonEdit.addEventListener("click", async () => {
    await showFormEdit(element);
  });

  let buttonDelete = document.createElement("button");
  buttonDelete.setAttribute("id", "deleteButton");
  let iconDelete = document.createElement("img");
  iconDelete.setAttribute("src", "./img/delete-button.svg");
  buttonDelete.appendChild(iconDelete);
  cardActions.appendChild(buttonDelete);
  buttonDelete.addEventListener("click", async () => {
    await destroy(element);
    removeCardEvents();
    await mostrar();
  });

  let desc = document.createElement("div");
  desc.classList.add("desc");
  desc.textContent = object.descricao;
  card.appendChild(desc);

  let datasDiv = document.createElement("div");
  datasDiv.classList.add("dates");
  datasDiv.textContent = `Data Inicio: ${object.dataInicio.substr(
    8,
    2
  )}/${object.dataInicio.substr(5, 2)}/${object.dataInicio.substr(
    0,
    4
  )} Data Fim: ${object.dataTermino.substr(8, 2)}/${object.dataTermino.substr(
    5,
    2
  )}/${object.dataTermino.substr(0, 4)}`;
  card.appendChild(datasDiv);

  let divButton = document.createElement("div");
  divButton.classList.add("showButton");
  let showButton = document.createElement("button");
  showButton.setAttribute("id", "showButton");
  showButton.textContent = "Mostrar";
  divButton.appendChild(showButton);
  card.appendChild(divButton);

  showButton.addEventListener("click", () => {
    let marker = markers.find((m) => m.id === element)
    map.setCenter(marker.getPosition());
    for (let markerSalvo of markers) {
      markerSalvo.setIcon(mapPinShowEvent);
    }
    marker.setIcon(mapPinFocusEvent);
  });
}

function sucessButton() {
  setTimeout(() => {
    buttonSave.style.background = "#011F39"; //blue
    buttonSave.textContent = "Salvar evento";
    buttonSave.style.cursor = "pointer";
    buttonSave.disabled = false;
  }, 2000);
  buttonSave.style.transition = "0.2s ease-in";
  buttonSave.style.background = "#53a653"; //green
  buttonSave.textContent = "Salvo!";
  buttonSave.style.cursor = "not-allowed";
  buttonSave.disabled = true;

  inputEvent.value = "";
  descricao.value = "";
  dataInicio.value = "";
  dataTermino.value = "";
}

function createMarkerWarning() {
  setTimeout(() => {
    buttonSave.style.background = "#011F39"; //blue
    buttonSave.textContent = "Salvar evento";
    buttonSave.style.cursor = "pointer";
    buttonSave.disabled = false;
  }, 2000);
  buttonSave.style.transition = "0.2s ease-in";
  buttonSave.style.background = "#A9A9A9"; //yellow
  buttonSave.textContent = "Crie um marcador";
  buttonSave.style.cursor = "not-allowed";
  buttonSave.disabled = true;
}

function inputWarning() {
  setTimeout(() => {
    buttonSave.style.background = "#011F39"; //blue
    buttonSave.textContent = "Salvar evento";
    buttonSave.style.cursor = "pointer";
    buttonSave.disabled = false;
  }, 2000);
  buttonSave.style.transition = "0.2s ease-in";
  buttonSave.style.background = "#ff3333"; //yellow
  buttonSave.textContent = "Digite o nome";
  buttonSave.style.cursor = "not-allowed";
  buttonSave.disabled = true;
}

function errorButton() {
  setTimeout(() => {
    buttonSave.style.background = "#011F39"; //blue
    buttonSave.textContent = "Salvar evento";
    buttonSave.style.cursor = "pointer";
    buttonSave.disabled = false;
  }, 3000);
  buttonSave.style.transition = "0.3s ease-in";
  buttonSave.style.background = "#ff3333"; //red
  buttonSave.textContent = "Erro!";
  buttonSave.style.cursor = "not-allowed";
  buttonSave.disabled = true;
}
